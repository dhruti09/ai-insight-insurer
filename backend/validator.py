from config import REQUIRED_COLUMNS


def validate_record(record):

    errors = []

    warnings = []

    for field in REQUIRED_COLUMNS:

        if record[field] == "":

            errors.append(f"{field} is required")

    age = record.get("Age", "")

    if age != "":

        try:

            age = int(float(age))

            if age < 18 or age > 100:

                warnings.append("Age looks unusual")

        except:

            warnings.append("Invalid Age")

    credit = record.get("Credit_Score", "")

    if credit != "":

        try:

            credit = int(float(credit))

            if credit < 300 or credit > 900:

                warnings.append("Invalid Credit Score")

        except:

            warnings.append("Credit Score is not numeric")

    income = record.get("Annual_Income_INR", "")

    if income != "":

        try:

            float(income)

        except:

            warnings.append("Annual Income is invalid")

    return errors, warnings