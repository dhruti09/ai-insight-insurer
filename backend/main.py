from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
import pandas as pd
import traceback
from sheets_service import get_next_customer_id
from normalizer import normalize_dataframe, convert_to_sheet_rows
from sheets_service import (
    append_rows,
    ensure_header_exists,
)

app = FastAPI(
    title="Insurance Lead Upload API",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():

    return {
        "status": "Running",
        "message": "Insurance Lead Upload API"
    }


@app.post("/upload-leads")
async def upload_leads(file: UploadFile = File(...)):

    try:

        # Check file type
        if not file.filename.lower().endswith((".xlsx", ".xls", ".csv")):
            raise HTTPException(
                status_code=400,
                detail="Only Excel or CSV files are allowed."
            )

        # Read uploaded file
        content = await file.read()

        if file.filename.lower().endswith(".csv"):
            df = pd.read_csv(BytesIO(content))
        else:
            df = pd.read_excel(BytesIO(content))

        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty."
            )
        next_customer = get_next_customer_id()
        # Normalize data
        records, summary = normalize_dataframe(df,next_customer)

        if len(records) == 0:

            return {

                "success": False,

                "message": "No valid records found.",

                "summary": summary
            }

        # Convert records into Google Sheet rows
        rows = convert_to_sheet_rows(records)

        # Make sure header exists
        ensure_header_exists()

        # Upload
        sheets_response = append_rows(rows)

        return {

            "success": True,

            "message": "Upload completed successfully.",

            "rows_uploaded": len(rows),

            "records": records,

            "summary": summary,

            "google_sheet_response": sheets_response

        }

    except HTTPException:

        raise

    except Exception as e:

        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
