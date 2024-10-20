import streamlit as st
import json
from datetime import datetime
import numpy as np
from enum import Enum
from dataclasses import dataclass
from typing import List, Dict, Tuple
from sentence_transformers import SentenceTransformer
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

# Load model and tokenizer
model = AutoModelForCausalLM.from_pretrained(
    "microsoft/Phi-3-mini-4k-instruct",
    device_map="cuda",
    torch_dtype="auto",
    trust_remote_code=True,
)
tokenizer = AutoTokenizer.from_pretrained("microsoft/Phi-3-mini-4k-instruct")

# Create a pipeline
pipe = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    return_full_text=False,
    max_new_tokens=500,
    do_sample=False,
)

class RiskLevel(Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

@dataclass
class SecurityDomain:
    name: str
    keywords: List[str]
    best_practices: List[str]
    risk_indicators: List[str]
    follow_up_templates: List[str]

@dataclass
class SecurityResponse:
    question: str
    answer: str
    domain: str
    risk_score: float
    risk_level: RiskLevel
    timestamp: str
    recommendations: List[str]
    reasoning: str

class DynamicSecurityConversationManager:
    def __init__(self, config_path: str = "knowledge_base.json"):
        self.conversation_history: List[SecurityResponse] = []
        self.risk_scores: Dict[str, List[float]] = {}
        self.encoder = SentenceTransformer('all-mpnet-base-v2')
        self.question_count = {domain: 0 for domain in self._load_domains(config_path)}

        # Load configuration from JSON
        with open(config_path, 'r') as f:
            config = json.load(f)

        # Initialize security domains from configuration
        self.security_domains = {}
        for domain_name, domain_data in config['domains'].items():
            self.security_domains[domain_name] = SecurityDomain(
                name=domain_data['name'],
                keywords=domain_data['keywords'],
                best_practices=domain_data['best_practices'],
                risk_indicators=domain_data['risk_indicators'],
                follow_up_templates=domain_data['follow_up_templates']
            )

        # Store risk thresholds
        self.domain_risk_thresholds = config['risk_thresholds']

    def _load_domains(self, config_path: str) -> List[str]:
        with open(config_path, 'r') as f:
            config = json.load(f)
        return list(config['domains'].keys())

    def process_response(self, question: str, answer: str) -> Dict:
        domain, domain_confidence = self._identify_domain(question, answer)
        risk_score, risk_level, reasoning = self._analyze_response(domain, answer)
        recommendations = self._generate_recommendations(domain, risk_score, answer)

        response = SecurityResponse(
            question=question,
            answer=answer,
            domain=domain,
            risk_score=risk_score,
            risk_level=risk_level,
            timestamp=datetime.now().isoformat(),
            recommendations=recommendations,
            reasoning=reasoning
        )

        self.conversation_history.append(response)
        if domain not in self.risk_scores:
            self.risk_scores[domain] = []
        self.risk_scores[domain].append(risk_score)

        next_question = self._generate_follow_up(domain, answer, risk_score)

        self.question_count[domain] += 1

        if self.question_count[domain] >= 2:
            domain = self._change_domain(domain)
            self.question_count[domain] = 0

        return {
            "current_response": response.__dict__,
            "next_question": next_question,
            "domain_confidence": domain_confidence,
            "risk_assessment": self._calculate_risk_assessment()
        }

    def _identify_domain(self, question: str, answer: str) -> Tuple[str, float]:
        combined_text = f"{question} {answer}"
        text_embedding = self.encoder.encode([combined_text])[0]

        best_match = None
        best_score = -1

        for domain_name, domain in self.security_domains.items():
            domain_context = " ".join(domain.keywords + domain.best_practices)
            domain_embedding = self.encoder.encode([domain_context])[0]
            similarity = np.dot(text_embedding, domain_embedding)

            if similarity > best_score:
                best_score = similarity
                best_match = domain_name

        return best_match, float(best_score)

    def _analyze_response(self, domain: str, answer: str) -> Tuple[float, RiskLevel, str]:
        domain_info = self.security_domains[domain]
        answer_embedding = self.encoder.encode([answer])[0]

        best_practices_embedding = self.encoder.encode(domain_info.best_practices)
        best_practices_similarities = np.dot(answer_embedding, best_practices_embedding.T)
        best_practices_score = float(np.mean(best_practices_similarities))

        risk_indicators_embedding = self.encoder.encode(domain_info.risk_indicators)
        risk_indicator_similarities = np.dot(answer_embedding, risk_indicators_embedding.T)

        risk_indicator_weights = [1.5 if "no" in ind.lower() or "lack" in ind.lower() else 1.0
                                for ind in domain_info.risk_indicators]
        weighted_risk_score = float(np.dot(risk_indicator_similarities, risk_indicator_weights) / sum(risk_indicator_weights))

        risk_score = (best_practices_score + (1 - weighted_risk_score)) / 2
        threshold = self.domain_risk_thresholds.get(domain, 0.7)

        if risk_score >= threshold:
            risk_level = RiskLevel.LOW
        elif risk_score >= threshold - 0.2:
            risk_level = RiskLevel.MEDIUM
        elif risk_score >= threshold - 0.4:
            risk_level = RiskLevel.HIGH
        else:
            risk_level = RiskLevel.CRITICAL

        reasoning = self._generate_reasoning(domain, best_practices_score, weighted_risk_score)
        return risk_score, risk_level, reasoning

    def _generate_recommendations(self, domain: str, risk_score: float, answer: str) -> List[str]:
        domain_info = self.security_domains[domain]
        answer_embedding = self.encoder.encode([answer])[0]

        recommendations = []
        practices_embeddings = self.encoder.encode(domain_info.best_practices)
        similarities = np.dot(answer_embedding, practices_embeddings.T)

        for i, similarity in enumerate(similarities):
            if similarity < 0.5:
                recommendations.append(f"Consider implementing: {domain_info.best_practices[i]}")

        return recommendations

    def _generate_follow_up(self, domain: str, answer: str, risk_score: float) -> str:
        domain_info = self.security_domains[domain]

        if risk_score < 0.5:
            templates = [t for t in domain_info.follow_up_templates
                       if any(word in t.lower() for word in ["how", "what measures", "plan"])]
        else:
            templates = [t for t in domain_info.follow_up_templates
                       if any(word in t.lower() for word in ["monitor", "review", "audit"])]

        if not templates:
            templates = domain_info.follow_up_templates

        template = np.random.choice(templates)
        return template.format(topic=domain_info.name.replace("_", " "))

    def _generate_reasoning(self, domain: str, best_practices_score: float, risk_indicator_score: float) -> str:
        return (f"Domain: {domain}\n"
                f"Alignment with best practices: {best_practices_score:.2f}\n"
                f"Presence of risk indicators: {risk_indicator_score:.2f}")

    def _calculate_risk_assessment(self) -> Dict:
        assessment = {
            "overall_risk_score": 0.0,
            "domain_scores": {},
            "timestamp": datetime.now().isoformat()
        }

        if not self.risk_scores:
            return assessment

        for domain, scores in self.risk_scores.items():
            domain_score = sum(scores) / len(scores)
            assessment["domain_scores"][domain] = {
                "score": domain_score,
                "risk_level": (RiskLevel.LOW if domain_score >= 0.8
                      else RiskLevel.MEDIUM if domain_score >= 0.6
                      else RiskLevel.HIGH if domain_score >= 0.4
                      else RiskLevel.CRITICAL).value
            }
            assessment["overall_risk_score"] += domain_score

        assessment["overall_risk_score"] /= len(self.risk_scores)
        return assessment

    def _change_domain(self, current_domain: str) -> str:
        recent_domains = {response.domain for response in self.conversation_history[-self.question_count[current_domain]:]}
        all_domains = list(self.security_domains.keys())
        available_domains = [domain for domain in all_domains if domain not in recent_domains and domain != current_domain]

        if not available_domains:
            available_domains = all_domains

        new_domain = np.random.choice(available_domains)
        self.question_count[new_domain] = 0
        return new_domain


def main():
    st.title("Dynamic Security Conversation Assistant")

    # Load the conversation manager
    conversation_manager = DynamicSecurityConversationManager(config_path="knowledge_base.json")

    # Initialize session state
    if 'conversation_history' not in st.session_state:
        st.session_state.conversation_history = []

    # User input
    question = st.text_input("Your question:")
    answer = st.text_area("Your answer:", height=150)

    if st.button("Submit"):
        if question and answer:
            response = conversation_manager.process_response(question, answer)
            st.session_state.conversation_history.append(response['current_response'])
            st.success("Response recorded!")

            st.subheader("Response Details")
            st.json(response['current_response'])

            st.subheader("Next Question")
            st.write(response['next_question'])

            st.subheader("Risk Assessment")
            st.json(response['risk_assessment'])
        else:
            st.error("Please provide both a question and an answer.")

    # Display conversation history
    st.subheader("Conversation History")
    if st.session_state.conversation_history:
        for idx, entry in enumerate(st.session_state.conversation_history):
            st.write(f"Q{idx + 1}: {entry['question']}")
            st.write(f"A{idx + 1}: {entry['answer']}")
            st.write(f"Domain: {entry['domain']}, Risk Score: {entry['risk_score']:.2f}, Risk Level: {entry['risk_level']}")
            st.write(f"Recommendations: {', '.join(entry['recommendations'])}")
            st.write("------")
    else:
        st.write("No conversation history yet.")


if __name__ == "__main__":
    main()
