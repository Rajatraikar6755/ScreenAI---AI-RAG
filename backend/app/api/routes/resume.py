"""Resume upload and parsing endpoint."""
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from app.models.resume import ResumeUploadResponse
from app.services.resume_service import ResumeService
from app.services.llm_service import LLMService
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

ALLOWED_TYPES = {"application/pdf", "text/plain", "application/octet-stream"}
MAX_FILE_SIZE_MB = 10


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    request: Request,
    file: UploadFile = File(...),
):
    """
    Upload and parse a resume (PDF or plain text).
    Returns extracted candidate data for session creation.
    """
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        if not (file.filename or "").lower().endswith((".pdf", ".txt")):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}. Please upload PDF or TXT.",
            )

    # Check file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large. Max size: {MAX_FILE_SIZE_MB}MB")

    # Reset file stream
    await file.seek(0)

    try:
        llm = LLMService()
        resume_service = ResumeService(llm_service=llm)
        resume_data = await resume_service.parse_resume(file)

        logger.info(f"Resume parsed: {resume_data.candidate_name} | {len(resume_data.skills)} skills found")

        return ResumeUploadResponse(
            resume_data=resume_data,
            file_name=file.filename or "resume",
        )

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Resume parsing error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")
