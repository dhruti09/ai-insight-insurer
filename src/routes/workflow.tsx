import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, Upload, Target, ShieldAlert, IndianRupee, MessageSquare, LayoutDashboard, CheckCircle2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LEADS, formatINR } from "@/lib/mockData";

export const Route = createFileRoute("/workflow")({
  head: () => ({
    meta: [
      { title: "AI Workflow · Insurance AI" },
      { name: "description", content: "Agentic AI workflow for insurance lead processing." },
    ],
  }),
  component: WorkflowPage,
});

function WorkflowPage() {
  const sample = LEADS.find((l) => l.priority === "High") ?? LEADS[0];

  const agents = [
    {
      icon: Upload, name: "Lead Intake", status: "Completed",
      output: `Lead ${sample.leadId} ingested from ${sample.leadSource}`,
      recommendation: "Forwarded for prioritization.",
    },
    {
      icon: Target, name: "Lead Prioritization Agent", status: "Completed",
      output: `Score ${sample.leadScore}/100 · ${sample.conversionProbability}% conversion probability`,
      recommendation: `${sample.priority} priority lead. Route to senior advisor.`,
    },
    {
      icon: ShieldAlert, name: "Risk Assessment Agent", status: "Completed",
      output: `Risk score ${sample.riskScore} · ${sample.riskLevel}`,
      recommendation: "Factors: age, claims history, vehicle profile.",
    },
    {
      icon: IndianRupee, name: "Pricing Agent", status: "Completed",
      output: `Suggested premium ${formatINR(sample.suggestedPremium)}`,
      recommendation: "Aligned with risk band and competitive market rate.",
    },
    {
      icon: MessageSquare, name: "Sales Recommendation Agent", status: "Completed",
      output: sample.aiSummary,
      recommendation: sample.nextBestAction,
    },
    {
      icon: LayoutDashboard, name: "Manager Dashboard", status: "Live",
      output: "Lead surfaced on executive dashboard with full AI context.",
      recommendation: "Ready for advisor pick-up.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agentic AI Workflow</h1>
        <p className="text-sm text-muted-foreground">
          Multi-agent pipeline processing lead <span className="font-mono">{sample.leadId}</span> — {sample.customerName}.
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-3">
        {agents.map((a, idx) => (
          <div key={a.name}>
            <Card className="border-l-4 border-l-primary transition hover:shadow-md">
              <CardContent className="flex gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <a.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{a.name}</h3>
                    <Badge variant={a.status === "Live" ? "default" : "secondary"} className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />{a.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm"><span className="text-muted-foreground">Output: </span>{a.output}</p>
                  <p className="mt-1 text-sm"><span className="text-muted-foreground">Recommendation: </span>{a.recommendation}</p>
                </div>
              </CardContent>
            </Card>
            {idx < agents.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
