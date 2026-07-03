import pandas as pd

from config import MASTER_COLUMNS, COLUMN_ALIASES
from validator import validate_record
from utils import clean_value, normalize_column_name, format_customer_id


def normalize_headers(df):
    """
    Convert uploaded Excel headers into Master Sheet headers.
    """

    mapped_columns = []

    for column in df.columns:

        clean = normalize_column_name(column)

        matched = None

        for master_column, aliases in COLUMN_ALIASES.items():

            alias_list = [normalize_column_name(a) for a in aliases]

            if clean in alias_list:
                matched = master_column
                break

        if matched:
            mapped_columns.append(matched)
        else:
            mapped_columns.append(column)

    df.columns = mapped_columns

    return df


def normalize_dataframe(df, start_customer_number):
    """
    Normalize uploaded dataframe into master schema.

    Parameters
    ----------
    df : pandas.DataFrame

    start_customer_number : int
        Next available customer number.

    Returns
    -------
    normalized_records
    upload_summary
    """

    df = normalize_headers(df)

    normalized_records = []

    upload_summary = {

        "total_rows": len(df),

        "uploaded": 0,

        "warnings": [],

        "errors": []

    }

    customer_number = start_customer_number

    for excel_index, row in df.iterrows():

        # Create blank record
        record = {}

        for column in MASTER_COLUMNS:
            record[column] = ""

        # Copy matching columns
        for column in df.columns:

            if column in MASTER_COLUMNS:

                record[column] = clean_value(row[column])

        # Auto Generate Customer ID
        record["Customer_ID"] = format_customer_id(customer_number)

        customer_number += 1

        # Force Status
        record["Status"] = "Unprocessed"

        # Validate record
        errors, warnings = validate_record(record)

        if errors:

            upload_summary["errors"].append({

                "excel_row": excel_index + 2,

                "customer_id": record["Customer_ID"],

                "errors": errors

            })

            continue

        if warnings:

            upload_summary["warnings"].append({

                "excel_row": excel_index + 2,

                "customer_id": record["Customer_ID"],

                "warnings": warnings

            })

        normalized_records.append(record)

    upload_summary["uploaded"] = len(normalized_records)

    upload_summary["failed"] = len(upload_summary["errors"])

    return normalized_records, upload_summary


def convert_to_sheet_rows(records):
    """
    Convert records into list of rows for Google Sheets.
    """

    rows = []

    for record in records:

        row = []

        for column in MASTER_COLUMNS:

            row.append(record.get(column, ""))

        rows.append(row)

    return rows