from typing import Dict, Any

def classify_query(query_text: str) -> Dict[str, str]:
    text = query_text.lower()

    # Rule precedence: P1 Critical Outage & Security triggers MUST take precedence
    if any(word in text for word in [
        "security incident", "data breach", "application is down",
        "all users", "service outage", "application down"
    ]):
        return {
            "intent": "Technical Error",
            "complexity": "High",
            "priority": "P1"
        }

    if any(word in text for word in [
        "basic plan", "features", "what features are included"
    ]):
        return {
            "intent": "General Information",
            "complexity": "Low",
            "priority": "P3"
        }

    if any(word in text for word in [
        "invoice", "payment", "billing", "subscription charge", "deducted"
    ]):
        return {
            "intent": "Billing",
            "complexity": "Medium",
            "priority": "P2"
        }

    if any(word in text for word in [
        "cannot log in", "account locked", "password", "log in to my account", "locked"
    ]):
        return {
            "intent": "Login / Access",
            "complexity": "Medium",
            "priority": "P2"
        }

    if any(word in text for word in [
        "add dark mode", "feature request", "new feature", "dark mode"
    ]):
        return {
            "intent": "Feature Request",
            "complexity": "Low",
            "priority": "P4"
        }

    if any(word in text for word in [
        "still unresolved", "did not work", "not working", "unresolved"
    ]):
        return {
            "intent": "Unresolved Issue",
            "complexity": "High",
            "priority": "P2"
        }

    if any(word in text for word in [
        "basic plan", "features", "how can i", "explain", "what features"
    ]):
        return {
            "intent": "General Information",
            "complexity": "Low",
            "priority": "P3"
        }

    return {
        "intent": "General Information",
        "complexity": "Low",
        "priority": "P3"
    }
