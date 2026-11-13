from typing import Dict, Any

def generate_notification(candidate: Dict[str, Any], status: str) -> Dict[str, Any]:
    name = candidate.get("candidate_name", "Applicant")
    candidate_id = candidate.get("candidate_id", "N/A")

    if status == "SHORTLIST_REVIEW":
        subject = "Application Update - Next Steps"
        message = (
            f"Dear {name},\n\n"
            f"Your application (Ref: {candidate_id}) is being considered for the next stage "
            "of our recruitment process. Our hiring team will review your dossier and contact you soon."
        )
    elif status == "MANUAL_REVIEW":
        subject = "Application Under Active Review"
        message = (
            f"Dear {name},\n\n"
            f"Your application (Ref: {candidate_id}) is currently under comprehensive review by "
            "the technical recruitment panel. We will notify you once evaluation concludes."
        )
    else:
        subject = "Application Status Update"
        message = (
            f"Dear {name},\n\n"
            f"Your application (Ref: {candidate_id}) is undergoing review by the recruitment team. "
            "You will be informed of formal next steps upon review completion."
        )

    return {
        "candidate_id": candidate_id,
        "recipient": candidate.get("email", ""),
        "subject": subject,
        "message": message,
        "status": "DRAFT"
    }
