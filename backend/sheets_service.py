import os

from dotenv import load_dotenv

from google.oauth2.service_account import Credentials

from googleapiclient.discovery import build

from config import MASTER_COLUMNS

load_dotenv()

SPREADSHEET_ID = os.getenv("SPREADSHEET_ID")

SHEET_NAME = os.getenv("SHEET_NAME")

GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE")


def get_service():

    creds = Credentials.from_service_account_file(

        GOOGLE_CREDENTIALS_FILE,

        scopes=["https://www.googleapis.com/auth/spreadsheets"]

    )

    service = build(

        "sheets",

        "v4",

        credentials=creds

    )

    return service


def ensure_header_exists():

    service = get_service()

    result = service.spreadsheets().values().get(

        spreadsheetId=SPREADSHEET_ID,

        range=f"{SHEET_NAME}!1:1"

    ).execute()

    values = result.get("values", [])

    if len(values) == 0:

        service.spreadsheets().values().update(

            spreadsheetId=SPREADSHEET_ID,

            range=f"{SHEET_NAME}!A1",

            valueInputOption="RAW",

            body={

                "values": [MASTER_COLUMNS]

            }

        ).execute()


def append_rows(rows):

    service = get_service()

    body = {

        "values": rows

    }

    result = service.spreadsheets().values().append(

        spreadsheetId=SPREADSHEET_ID,

        range=f"{SHEET_NAME}!A1",

        valueInputOption="RAW",

        insertDataOption="INSERT_ROWS",

        body=body

    ).execute()

    return result


def get_existing_customer_ids():

    service = get_service()

    result = service.spreadsheets().values().get(

        spreadsheetId=SPREADSHEET_ID,

        range=f"{SHEET_NAME}!A2:A"

    ).execute()

    values = result.get("values", [])

    ids = set()

    for row in values:

        if len(row):

            ids.add(row[0])

    return ids

import re

def get_next_customer_id():

    service = get_service()

    result = service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f"{SHEET_NAME}!A2:A"
    ).execute()

    values = result.get("values", [])

    if not values:
        return 1

    last_number = 0

    for row in values:

        if not row:
            continue

        customer_id = row[0]

        match = re.search(r'(\d+)', customer_id)

        if match:

            number = int(match.group(1))

            if number > last_number:
                last_number = number

    return last_number + 1