import uuid
import pandas as pd
import re


def generate_customer_id():
    return "C" + uuid.uuid4().hex[:8].upper()


def clean_value(value):

    if pd.isna(value):
        return ""

    return str(value).strip()


def normalize_column_name(column):
    value = str(column).strip()
    value = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", value)
    value = re.sub(r"[^A-Za-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip().lower()

def format_customer_id(number):

    return f"C{number:05d}"
