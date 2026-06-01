// Mock data generator for AI-Powered Insurance Pricing & Lead Intelligence demo

export type Priority = "High" | "Medium" | "Low";
export type RiskLevel = "Low Risk" | "Medium Risk" | "High Risk";
export type InsuranceType = "Motor Insurance" | "Travel Insurance" | "Home Insurance";
export type VehicleType = "Sedan" | "SUV" | "Hatchback" | "Luxury Vehicle";
export type LeadSource = "Website" | "Mobile App" | "Call Center" | "Agent" | "Broker";

export interface Lead {
  leadId: string;
  customerName: string;
  age: number;
  gender: "Male" | "Female";
  city: string;
  insuranceType: InsuranceType;
  vehicleType: VehicleType;
  vehicleValue: number;
  annualIncome: number;
  existingCustomer: boolean;
  previousClaims: number;
  leadSource: LeadSource;
  leadDate: string;
  // AI outputs
  leadScore: number;
  priority: Priority;
  conversionProbability: number;
  riskScore: number;
  riskLevel: RiskLevel;
  suggestedPremium: number;
  aiSummary: string;
  nextBestAction: string;
}

const firstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Rohan", "Priya", "Ananya", "Diya", "Saanvi", "Aanya", "Pari", "Myra", "Aadhya", "Kavya", "Ira", "Rahul", "Amit", "Neha", "Pooja", "Sneha", "Vikram", "Karan", "Manish", "Ritika", "Sanjay"];
const lastNames = ["Sharma", "Verma", "Gupta", "Patel", "Singh", "Kumar", "Reddy", "Iyer", "Nair", "Mehta", "Kapoor", "Joshi", "Malhotra", "Chopra", "Bose", "Rao", "Shah", "Das", "Pillai", "Khanna"];
const cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Surat"];
const insuranceTypes: InsuranceType[] = ["Motor Insurance", "Travel Insurance", "Home Insurance"];
const vehicleTypes: VehicleType[] = ["Sedan", "SUV", "Hatchback", "Luxury Vehicle"];
const leadSources: LeadSource[] = ["Website", "Mobile App", "Call Center", "Agent", "Broker"];

// Seeded RNG for stable demo data
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

function computeLead(base: Omit<Lead, "leadScore" | "priority" | "conversionProbability" | "riskScore" | "riskLevel" | "suggestedPremium" | "aiSummary" | "nextBestAction">): Lead {
  // Lead Score
  let score = 40;
  if (base.existingCustomer) score += 20;
  score -= base.previousClaims * 5;
  if (base.annualIncome > 1500000) score += 15;
  else if (base.annualIncome > 800000) score += 8;
  if (base.vehicleType === "Luxury Vehicle") score += 12;
  else if (base.vehicleType === "SUV") score += 6;
  if (base.leadSource === "Agent" || base.leadSource === "Broker") score += 10;
  else if (base.leadSource === "Website") score += 5;
  score += randInt(-5, 10);
  score = Math.max(10, Math.min(99, score));

  const priority: Priority = score >= 80 ? "High" : score >= 50 ? "Medium" : "Low";
  const conversionProbability = Math.round(Math.min(95, score * 0.9 + randInt(-5, 8)));

  // Risk
  let risk = 30;
  if (base.age < 25 || base.age > 65) risk += 15;
  risk += base.previousClaims * 10;
  if (base.vehicleValue > 2500000) risk += 15;
  else if (base.vehicleValue > 1200000) risk += 8;
  if (base.vehicleType === "Luxury Vehicle") risk += 12;
  else if (base.vehicleType === "SUV") risk += 5;
  risk += randInt(-5, 10);
  risk = Math.max(10, Math.min(95, risk));
  const riskLevel: RiskLevel = risk < 40 ? "Low Risk" : risk < 70 ? "Medium Risk" : "High Risk";

  // Premium
  let premium: number;
  if (riskLevel === "Low Risk") premium = randInt(10000, 15000);
  else if (riskLevel === "Medium Risk") premium = randInt(15000, 25000);
  else premium = randInt(25000, 40000);

  // AI summary
  const summaryParts: string[] = [];
  summaryParts.push(base.existingCustomer ? "Existing customer" : "New prospect");
  summaryParts.push(base.previousClaims === 0 ? "with no claims history" : `with ${base.previousClaims} prior claim${base.previousClaims > 1 ? "s" : ""}`);
  if (base.annualIncome > 1500000) summaryParts.push("and high income bracket");
  else if (base.annualIncome > 800000) summaryParts.push("and stable income");
  const tail = priority === "High" ? "High likelihood of policy purchase." : priority === "Medium" ? "Moderate conversion potential." : "Lower conversion likelihood; nurture required.";
  const aiSummary = summaryParts.join(" ") + ". " + tail;

  const nextBestAction =
    priority === "High"
      ? "Contact within 30 minutes and offer premium package with loyalty discount."
      : priority === "Medium"
        ? "Schedule callback within 24 hours; share comparison quote."
        : "Add to nurture campaign and re-engage in 7 days.";

  return {
    ...base,
    leadScore: score,
    priority,
    conversionProbability,
    riskScore: risk,
    riskLevel,
    suggestedPremium: premium,
    aiSummary,
    nextBestAction,
  };
}

function generateLeads(count: number): Lead[] {
  const leads: Lead[] = [];
  for (let i = 1; i <= count; i++) {
    const insuranceType = pick(insuranceTypes);
    const vehicleType = pick(vehicleTypes);
    const gender = rand() > 0.45 ? "Male" : "Female";
    const daysAgo = randInt(0, 60);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const base = {
      leadId: `LD-${(10000 + i).toString()}`,
      customerName: `${pick(firstNames)} ${pick(lastNames)}`,
      age: randInt(22, 70),
      gender,
      city: pick(cities),
      insuranceType,
      vehicleType,
      vehicleValue: randInt(500000, 4000000),
      annualIncome: randInt(400000, 3000000),
      existingCustomer: rand() > 0.55,
      previousClaims: randInt(0, 4),
      leadSource: pick(leadSources),
      leadDate: date.toISOString().slice(0, 10),
    };
    leads.push(computeLead(base as Lead));
  }
  return leads;
}

export const LEADS: Lead[] = generateLeads(100);

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
