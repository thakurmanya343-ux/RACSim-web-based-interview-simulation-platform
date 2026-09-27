import streamlit as st
import requests
import json
import base64
import time

# -------------------------------------------------------------
# Configuration & Constants
# -------------------------------------------------------------
st.set_page_config(
    page_title="RACSim - Selector-Applicant Simulation Platform",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded"
)

NODE_API_URL = "http://localhost:5000/api"
AI_SERVICE_URL = "http://127.0.0.1:8000"

# Custom CSS for polished government / hackathon board-room styling
st.markdown("""
<style>
    .main-title {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1E3A8A;
        margin-bottom: 0.2rem;
    }
    .sub-title {
        font-size: 1rem;
        color: #4B5563;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
    }
    .badge-tag {
        display: inline-block;
        background-color: #E0E7FF;
        color: #3730A3;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.82rem;
        font-weight: 600;
        margin-right: 6px;
        margin-bottom: 6px;
    }
    .badge-covered {
        display: inline-block;
        background-color: #DEF7EC;
        color: #03543F;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.82rem;
        font-weight: 600;
        margin-right: 6px;
        margin-bottom: 6px;
    }
    .badge-missed {
        display: inline-block;
        background-color: #FDE8E8;
        color: #9B1C1C;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.82rem;
        font-weight: 600;
        margin-right: 6px;
        margin-bottom: 6px;
    }
    .transcript-box {
        background-color: #F9FAFB;
        border-left: 4px solid #3B82F6;
        padding: 12px 16px;
        margin-bottom: 10px;
        border-radius: 4px;
    }
</style>
""", unsafe_allow_html=True)

# -------------------------------------------------------------
# Helper Functions
# -------------------------------------------------------------
def check_service_health():
    node_ok = False
    ai_ok = False
    try:
      r1 = requests.get(f"{NODE_API_URL}/health", timeout=2)
      if r1.status_code == 200:
          node_ok = True
    except Exception:
      pass

    try:
      r2 = requests.get(f"{AI_SERVICE_URL}/health", timeout=2)
      if r2.status_code == 200:
          ai_ok = True
    except Exception:
      pass

    return node_ok, ai_ok

# -------------------------------------------------------------
# Sidebar Navigation & System Status
# -------------------------------------------------------------
with st.sidebar:
    st.image("https://img.icons8.com/color/96/artificial-intelligence.png", width=64)
    st.markdown("### **RACSim PSWB01**")
    st.caption("Selector-Applicant Simulation Platform")

    node_ok, ai_ok = check_service_health()
    col_s1, col_s2 = st.columns(2)
    with col_s1:
        if node_ok:
            st.success("🟢 API: 5000")
        else:
            st.error("🔴 API: 5000")
    with col_s2:
        if ai_ok:
            st.success("🟢 NLP: 8000")
        else:
            st.error("🔴 NLP: 8000")

    st.markdown("---")
    menu = st.radio(
        "Navigation",
        [
            "🏠 System Dashboard",
            "👤 Candidate CV Parser",
            "📚 Question Bank & Recommender",
            "🎙️ Board Room & Voice Interview",
            "💻 Live Coding Sandbox",
            "⚖️ Expert Audit & Reports"
        ]
    )
    st.markdown("---")
    st.caption("E: Drive Storage • Hugging Face all-MiniLM-L6-v2 • Speech-to-Text")


# =============================================================
# 1. SYSTEM DASHBOARD
# =============================================================
if menu == "🏠 System Dashboard":
    st.markdown('<div class="main-title">RACSim Interview Simulation System</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Web-Based Selector-Applicant Simulation Platform (PSWB01 Hackathon 2026-27)</div>', unsafe_allow_html=True)

    col1, col2, col3, col4 = st.columns(4)
    try:
        posts_res = requests.get(f"{NODE_API_URL}/posts").json()
        cand_res = requests.get(f"{NODE_API_URL}/candidates/cand-001").json()
        q_res = requests.get(f"{NODE_API_URL}/questions").json()

        col1.metric("Available Job Posts", len(posts_res.get("data", [])))
        col2.metric("Question Bank Size", len(q_res.get("data", [])))
        col3.metric("Candidate In System", cand_res.get("data", {}).get("name", "Active"))
        col4.metric("AI Embedding Engine", "MiniLM-L6-v2")
    except Exception as e:
        st.warning(f"Could not load initial metrics: {e}")

    st.markdown("### Architecture Pipeline Overview")
    st.info("""
    **Core Simulation Pipeline Flow**:
    1. **Registration & Auth**: Role-based access control (Candidate, Expert Panel, Admin).
    2. **CV Intelligence**: Extracts skills, domain tags, education & experience.
    3. **Adaptive Questioning**: Automatically tunes difficulty (Level 1 to 3) based on real-time answer performance.
    4. **Multi-Dimensional AI Scoring**: Cosine semantic similarity + expected concept coverage.
    5. **Speech-to-Text (STT)**: Microphone & voice answers transcribed to live transcript log.
    6. **Live Coding Sandbox**: Candidate codes in Python/JS with live interviewer synchronization.
    7. **Board Room Dossier**: Printable PDF generation with expert manual adjustments and bias consistency audit.
    """)

    # Quick API Endpoints Table
    st.markdown("### Registered Backend API Endpoints")
    try:
        api_info = requests.get(NODE_API_URL).json()
        endpoints = api_info.get("endpoints", [])
        st.dataframe(endpoints, use_container_width=True)
    except Exception as e:
        st.error(f"Failed to fetch endpoints: {e}")


# =============================================================
# 2. CANDIDATE PROFILE & CV PARSER
# =============================================================
elif menu == "👤 Candidate CV Parser":
    st.markdown('<div class="main-title">Candidate Profile & CV Intelligence</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Automated NLP parsing of technical skills, education, and domain taxonomy</div>', unsafe_allow_html=True)

    try:
        cand_res = requests.get(f"{NODE_API_URL}/candidates/cand-001").json()
        cand = cand_res.get("data", {})
    except Exception as e:
        st.error(f"Error fetching candidate: {e}")
        cand = {}

    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("Candidate Information")
        st.write(f"**Candidate ID:** `{cand.get('id', 'cand-001')}`")
        st.write(f"**Name:** {cand.get('name', 'Dr. Aarav Sharma')}")
        st.write(f"**Applied Post:** `{cand.get('appliedPost', 'post-scientist-b-ai')}`")

        st.markdown("#### Current Skills in Profile")
        current_skills = cand.get("skills", [])
        for skill in current_skills:
            st.markdown(f'<span class="badge-tag">{skill}</span>', unsafe_allow_html=True)

    with col2:
        st.subheader("Intelligent CV Parser")
        sample_cv_text = """Dr. Aarav Sharma
Ph.D. in Computer Science with M.Tech in Artificial Intelligence.
Over 5 years of research experience in Deep Learning, Computer Vision, PyTorch, and TensorFlow.
Built convolutional neural networks, vision transformers (ViT), and real-time object detection models with YOLO.
Proficient in Python, REST APIs, Docker, and Git."""

        cv_input = st.text_area("Paste CV Text or Upload Document:", sample_cv_text, height=180)

        if st.button("🚀 Parse CV with AI Microservice", type="primary"):
            with st.spinner("Extracting technical skills, degree, and domain taxonomy..."):
                try:
                    res = requests.post(
                        f"{NODE_API_URL}/candidates/{cand.get('id', 'cand-001')}/resume",
                        data={"resumeText": cv_input}
                    ).json()

                    if res.get("success"):
                        st.success("CV Successfully Parsed & Profile Updated!")
                        profile = res.get("data", {}).get("parsedProfile", {})

                        st.write(f"**Detected Degree/Education:** {', '.join(profile.get('education', []))}")
                        st.write(f"**Estimated Experience:** {profile.get('experienceYears', 0)} Years")

                        st.markdown("**Domain Tags:**")
                        for d in res.get("data", {}).get("domainTags", []):
                            st.markdown(f'<span class="badge-tag" style="background:#FEF3C7;color:#92400E;">{d}</span>', unsafe_allow_html=True)

                        st.markdown("**Extracted Technical Skills:**")
                        for s in profile.get("skills", []):
                            st.markdown(f'<span class="badge-covered">{s}</span>', unsafe_allow_html=True)
                    else:
                        st.error(f"Parsing failed: {res.get('error')}")
                except Exception as e:
                    st.error(f"Error connecting to server: {e}")


# =============================================================
# 3. QUESTION BANK & RECOMMENDER
# =============================================================
elif menu == "📚 Question Bank & Recommender":
    st.markdown('<div class="main-title">Question Bank & Recommendation Engine</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Stages: IceBreaking → ProjectDiscussion → TechnicalCore → ProblemSolving → BoardWrapUp</div>', unsafe_allow_html=True)

    tab1, tab2 = st.tabs(["🔍 Browse Question Bank", "🎯 AI Skill-Based Question Recommendation"])

    with tab1:
        col_f1, col_f2 = st.columns(2)
        with col_f1:
            stage_filter = st.selectbox(
                "Filter by Interview Stage",
                ["All", "IceBreaking", "ProjectDiscussion", "TechnicalCore", "ProblemSolving", "BoardWrapUp"]
            )
        with col_f2:
            domain_filter = st.selectbox("Filter by Domain", ["All", "AI", "Software Engineering"])

        params = {}
        if stage_filter != "All":
            params["stage"] = stage_filter
        if domain_filter != "All":
            params["domain"] = domain_filter

        try:
            q_res = requests.get(f"{NODE_API_URL}/questions", params=params).json()
            questions_list = q_res.get("data", [])
            st.write(f"Showing **{len(questions_list)}** question(s):")

            for q in questions_list:
                with st.expander(f"[{q.get('stage')}] (Difficulty: {q.get('difficulty')}) - {q.get('text')[:60]}..."):
                    st.write(f"**Full Question:** {q.get('text')}")
                    st.write(f"**Domain:** `{q.get('domain')}` | **Stage:** `{q.get('stage')}` | **Difficulty:** Level {q.get('difficulty')}")
                    st.markdown("**Expected Concepts:**")
                    for c in q.get("expectedConcepts", []):
                        st.markdown(f'<span class="badge-tag">{c}</span>', unsafe_allow_html=True)
        except Exception as e:
            st.error(f"Error fetching questions: {e}")

    with tab2:
        st.subheader("AI Skill-Matched Question Recommender")
        st.caption("Finds questions from the bank that directly test skills extracted from the candidate's CV.")

        if st.button("Generate Question Recommendations for Candidate (cand-001)", type="primary"):
            with st.spinner("Analyzing candidate CV skills against question bank..."):
                try:
                    rec_res = requests.get(f"{NODE_API_URL}/questions/recommend", params={"candidateId": "cand-001", "limit": 4}).json()
                    recs = rec_res.get("data", [])
                    st.success(f"Recommended {len(recs)} tailored questions:")
                    for idx, r in enumerate(recs, 1):
                        st.markdown(f"""
                        <div class="metric-card">
                            <h4>#{idx}. {r.get('text')}</h4>
                            <p><b>Stage:</b> {r.get('stage')} | <b>Difficulty Level:</b> {r.get('difficulty')} | <b>Matched Skills Count:</b> {r.get('matchedSkillsCount')}</p>
                            <p><b>Matched Skills:</b> {', '.join(r.get('matchedSkills', []))}</p>
                        </div>
                        """, unsafe_allow_html=True)
                except Exception as e:
                    st.error(f"Recommender error: {e}")


# =============================================================
# 4. BOARD ROOM & VOICE INTERVIEW
# =============================================================
elif menu == "🎙️ Board Room & Voice Interview":
    st.markdown('<div class="main-title">Live Board Room Interview Simulation</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Adaptive Progression • Multi-Dimensional AI Scoring • Speech-to-Text Voice Answering</div>', unsafe_allow_html=True)

    # Initialize session state in Streamlit
    if "session_id" not in st.session_state:
        st.session_state.session_id = None
    if "current_question" not in st.session_state:
        st.session_state.current_question = None
    if "adaptive_info" not in st.session_state:
        st.session_state.adaptive_info = ""

    # Top Control Bar
    col_c1, col_c2, col_c3 = st.columns([2, 1, 1])
    with col_c1:
        st.write(f"**Active Session:** `{st.session_state.session_id or 'No active session'}`")
    with col_c2:
        if st.button("✨ Start New Interview Session", type="primary"):
            try:
                res = requests.post(f"{NODE_API_URL}/interviews", json={
                    "candidateId": "cand-001",
                    "postId": "post-scientist-b-ai",
                    "level": "Intermediate",
                    "targetQuestionCount": 5
                }).json()

                if res.get("success"):
                    st.session_state.session_id = res["data"]["session"]["id"]
                    st.session_state.current_question = res["data"]["currentQuestion"]
                    st.session_state.adaptive_info = res["data"].get("adaptiveReasoning", "")
                    st.success(f"Started session {st.session_state.session_id}")
                    st.rerun()
            except Exception as e:
                st.error(f"Failed to create session: {e}")

    with col_c3:
        if st.session_state.session_id and st.button("🏁 Conclude & Final Report"):
            try:
                res = requests.post(f"{NODE_API_URL}/interviews/{st.session_state.session_id}/finish").json()
                if res.get("success"):
                    st.session_state.final_report = res.get("data")
                    st.success("Session concluded! See final evaluation below.")
            except Exception as e:
                st.error(f"Error finishing session: {e}")

    st.markdown("---")

    # If Session Active
    if st.session_state.session_id and st.session_state.current_question:
        q = st.session_state.current_question

        # Stage Banner
        col_st1, col_st2, col_st3 = st.columns(3)
        col_st1.metric("Interview Stage", q.get("stage", "Unknown"))
        col_st2.metric("Difficulty Level", f"Level {q.get('difficulty', 1)} / 3")
        col_st3.metric("Expected Concepts", len(q.get("expectedConcepts", [])))

        st.markdown(f"""
        <div class="metric-card" style="border-left: 5px solid #2563EB;">
            <h3 style="color:#1E3A8A; margin-top:0;">Selector Question:</h3>
            <p style="font-size:1.15rem; font-weight:500;">{q.get('text')}</p>
        </div>
        """, unsafe_allow_html=True)

        # Expected Concepts preview for reviewers
        st.markdown("**Expected Concepts (Rubric):**")
        for concept in q.get("expectedConcepts", []):
            st.markdown(f'<span class="badge-tag">{concept}</span>', unsafe_allow_html=True)

        st.markdown("### Candidate Answer Submission")
        ans_mode = st.radio("Choose Input Mode:", ["📝 Text Answer Box", "🎙️ Speech-to-Text / Voice Answer"], horizontal=True)

        if ans_mode == "📝 Text Answer Box":
            ans_text = st.text_area(
                "Type Candidate Answer:",
                value="I implemented convolutional neural networks and vision transformers for real-time feature extraction.",
                height=110
            )

            if st.button("📤 Submit Text Answer", type="primary"):
                with st.spinner("AI evaluating answer relevance and concept coverage..."):
                    try:
                        res = requests.post(
                            f"{NODE_API_URL}/interviews/{st.session_state.session_id}/answers",
                            json={"questionId": q.get("id"), "answerText": ans_text}
                        ).json()

                        if res.get("success"):
                            st.session_state.last_eval = res.get("data", {})
                            st.success("Answer successfully evaluated by AI!")

                            # Advance adaptive question
                            next_res = requests.post(f"{NODE_API_URL}/interviews/{st.session_state.session_id}/next-question").json()
                            if next_res.get("isFinished"):
                                st.info("All target interview questions completed!")
                            elif next_res.get("data", {}).get("nextQuestion"):
                                st.session_state.current_question = next_res["data"]["nextQuestion"]
                                st.session_state.adaptive_info = next_res["data"].get("adaptiveReasoning", "")

                            st.rerun()
                    except Exception as e:
                        st.error(f"Error submitting answer: {e}")

        else: # Voice Answer
            st.info("🎙️ **Voice Flow Active:** Microphone/Audio → STT Transcription → Live Transcript → Semantic Scoring → Adaptive Progression.")

            voice_hint = st.text_input(
                "Candidate Spoken Speech (or browser Web Speech input):",
                value="I completed my degree in computer science and have specialized in deep learning and PyTorch neural networks for perception."
            )

            col_v1, col_v2 = st.columns(2)
            with col_v1:
                uploaded_audio = st.file_uploader("Optional: Upload WAV Audio Recording", type=["wav", "webm", "mp3"])

            if st.button("🎙️ Process Voice Answer & Evaluate", type="primary"):
                with st.spinner("Transcribing speech and running multi-dimensional AI scoring..."):
                    try:
                        files = {}
                        data_payload = {
                            "questionId": q.get("id"),
                            "hint": voice_hint,
                            "language": "en-US"
                        }
                        if uploaded_audio:
                            files = {"audio": (uploaded_audio.name, uploaded_audio.getvalue(), "audio/wav")}

                        res = requests.post(
                            f"{NODE_API_URL}/interviews/{st.session_state.session_id}/voice-answer",
                            data=data_payload,
                            files=files
                        ).json()

                        if res.get("success"):
                            st.session_state.last_eval = res.get("data", {})
                            st.success("Voice Answer Transcribed and Evaluated!")

                            # Update next question
                            if res.get("data", {}).get("nextQuestion"):
                                st.session_state.current_question = res["data"]["nextQuestion"]
                                st.session_state.adaptive_info = res["data"].get("adaptiveReasoning", "")
                            st.rerun()
                        else:
                            st.error(f"Voice answer failed: {res.get('error')}")
                    except Exception as e:
                        st.error(f"Error processing voice answer: {e}")

        # Display Last AI Evaluation
        if "last_eval" in st.session_state:
            ev = st.session_state.last_eval
            scoring = ev.get("scoring") or ev

            st.markdown("### Real-Time AI Scoring & Feedback")
            col_sc1, col_sc2 = st.columns(2)
            col_sc1.metric("Question Relevance Score", f"{scoring.get('relevanceScore', 0)}%")
            col_sc2.metric("Technical Concept Coverage", f"{scoring.get('conceptCoverageScore', 0)}%")

            st.markdown("**Covered Concepts:**")
            for c in scoring.get("coveredConcepts", []):
                st.markdown(f'<span class="badge-covered">✓ {c}</span>', unsafe_allow_html=True)
            if not scoring.get("coveredConcepts"):
                st.caption("None covered yet.")

            st.markdown("**Missed Concepts:**")
            for m in scoring.get("missedConcepts", []):
                st.markdown(f'<span class="badge-missed">✗ {m}</span>', unsafe_allow_html=True)

            if st.session_state.adaptive_info:
                st.info(f"**Adaptive Engine Rationale:** {st.session_state.adaptive_info}")

        # Live Transcript Accordion
        with st.expander("📜 Live Chronological Board Room Transcript", expanded=True):
            try:
                tr_res = requests.get(f"{NODE_API_URL}/interviews/{st.session_state.session_id}/transcript").json()
                tr_list = tr_res.get("data", [])
                if not tr_list:
                    st.caption("No transcript records yet.")
                for item in tr_list:
                    speaker = item.get("speaker", "candidate").upper()
                    st.markdown(f"""
                    <div class="transcript-box">
                        <b>[{speaker}]:</b> {item.get('text')}
                        <br><small style="color:#6B7280;">Engine: {item.get('engine')} | Confidence: {item.get('confidence')}</small>
                    </div>
                    """, unsafe_allow_html=True)
            except Exception as e:
                st.warning(f"Could not load transcript: {e}")

    elif "final_report" in st.session_state:
        rep = st.session_state.final_report
        st.markdown("### 🏆 Official Board Room Final Evaluation Report")

        st.metric("Final Weighted Suitability Score", f"{rep.get('finalWeightedScore', 0)}%")

        col_r1, col_r2, col_r3, col_r4 = st.columns(4)
        col_r1.metric("Technical Knowledge", f"{rep.get('technicalKnowledgeScore', 0)}%")
        col_r2.metric("Answer Relevance", f"{rep.get('answerRelevanceAvg', 0)}%")
        col_r3.metric("Communication", f"{rep.get('communicationScore', 0)}%")
        col_r4.metric("Depth & Consistency", f"{rep.get('consistencyScore', 0)}%")

        st.markdown(f"""
        <a href="{NODE_API_URL}/report/{rep.get('candidateId')}/{rep.get('postId')}/pdf" target="_blank">
            <button style="background-color:#1E3A8A;color:white;padding:10px 20px;border:none;border-radius:6px;font-weight:600;cursor:pointer;">
                📄 Download Official Evaluation Dossier (PDF)
            </button>
        </a>
        """, unsafe_allow_html=True)
    else:
        st.info("👆 Click **'Start New Interview Session'** above to begin the simulated interview!")


# =============================================================
# 5. LIVE CODING SANDBOX
# =============================================================
elif menu == "💻 Live Coding Sandbox":
    st.markdown('<div class="main-title">Live Coding Room & Code Sandbox</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Interviewer synchronization • Safe timed sandbox • Multi-language execution</div>', unsafe_allow_html=True)

    profession = st.selectbox(
        "Select Candidate Profession:",
        ["Artificial Intelligence", "Full-Stack Web Development", "Backend Systems", "Data Engineering"]
    )

    if "current_room" not in st.session_state or st.session_state.get("room_profession") != profession:
        try:
            r_res = requests.post(f"{NODE_API_URL}/coding/room", json={"profession": profession}).json()
            if r_res.get("success"):
                st.session_state.current_room = r_res["data"]["room"]
                st.session_state.room_profession = profession
        except Exception as e:
            st.error(f"Error creating room: {e}")

    room = st.session_state.get("current_room", {})

    st.markdown(f"""
    <div class="metric-card">
        <h4 style="margin-top:0;">Challenge: {room.get('challengeTitle', 'Technical Coding Assessment')}</h4>
        <p>{room.get('challengeDescription', '')}</p>
        <small>Room ID: <code>{room.get('id')}</code> | Language: <code>{room.get('language')}</code></small>
    </div>
    """, unsafe_allow_html=True)

    code_input = st.text_area(
        "Candidate Code Canvas:",
        value=room.get("code", "# Write solution here"),
        height=260
    )

    col_btn1, col_btn2 = st.columns([1, 4])
    with col_btn1:
        run_clicked = st.button("▶️ Run Code in Sandbox", type="primary")

    if run_clicked:
        with st.spinner("Executing code in secure sandbox..."):
            try:
                # Sync candidate code to room
                requests.post(f"{NODE_API_URL}/coding/room/{room.get('id')}/code", json={"code": code_input})

                # Execute
                exec_res = requests.post(
                    f"{NODE_API_URL}/coding/run-code",
                    json={"roomId": room.get("id"), "code": code_input, "language": room.get("language", "python")}
                ).json()

                st.session_state.last_exec = exec_res
            except Exception as e:
                st.error(f"Execution failed: {e}")

    if "last_exec" in st.session_state:
        res = st.session_state.last_exec
        st.markdown("### Execution Output")

        col_m1, col_m2, col_m3 = st.columns(3)
        col_m1.metric("Status", res.get("status", "unknown").upper())
        col_m2.metric("Execution Time", res.get("time", "0.0s"))
        col_m3.metric("Memory Usage", res.get("memory", "0 KB"))

        if res.get("stdout"):
            st.success("Standard Output:")
            st.code(res.get("stdout"))
        if res.get("stderr"):
            st.error("Standard Error:")
            st.code(res.get("stderr"))


# =============================================================
# 6. EXPERT AUDIT & REPORTS
# =============================================================
elif menu == "⚖️ Expert Audit & Reports":
    st.markdown('<div class="main-title">Expert Consistency Audit & Rubric Scoring</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Section 20 & 21: Quality control, variance tracking, and bias detection</div>', unsafe_allow_html=True)

    tab_a1, tab_a2 = st.tabs(["📊 Expert Consistency & Bias Audit", "✍️ Manual Rubric Score Entry"])

    with tab_a1:
        st.subheader("Statistical QC & Consistency Metrics")
        try:
            audit_res = requests.get(f"{NODE_API_URL}/admin/audit/expert-consistency").json()
            if audit_res.get("success"):
                data = audit_res.get("data", {})
                overall = data.get("overallMetrics", {})

                col_u1, col_u2, col_u3 = st.columns(3)
                col_u1.metric("Overall Expert Average", f"{overall.get('overallAverage', 0)} / 100")
                col_u2.metric("Scoring Std Dev", f"{overall.get('scoringStdDev', 0)}")
                col_u3.metric("AI vs Expert Divergence", f"{overall.get('aiVsHumanDivergence', 0)} pts")

                flags = data.get("auditFlags", [])
                st.markdown("#### Audit Quality Flags")
                if flags:
                    for f in flags:
                        st.warning(f"**Flag:** `{f.get('flag')}`: {f.get('advisory')} (Threshold: {f.get('threshold')}, Observed: {f.get('observed')})")
                else:
                    st.success("All evaluation patterns are within normal statistical tolerances.")

                st.markdown("#### Expert Scoring Breakdown")
                st.dataframe(data.get("expertEvaluations", []), use_container_width=True)
        except Exception as e:
            st.error(f"Failed to fetch audit metrics: {e}")

    with tab_a2:
        st.subheader("Manual Rubric Scoring Entry")
        st.caption("Allows board room experts to enter granular marks and adjust scores with justification notes.")

        ans_id = st.text_input("Answer ID to score:", value="ans-1790479056374-8iyo")

        col_sc1, col_sc2 = st.columns(2)
        with col_sc1:
            tech = st.slider("Technical Knowledge (35%)", 0, 100, 85)
            depth = st.slider("Depth & Completeness (15%)", 0, 100, 80)
        with col_sc2:
            comm = st.slider("Communication Clarity (10%)", 0, 100, 90)
            cons = st.slider("Consistency (5%)", 0, 100, 88)

        expert_notes = st.text_input("Expert Remarks / Justification:", "Candidate showed sound reasoning on architecture.")

        if st.button("💾 Save Expert Evaluation", type="primary"):
            try:
                res = requests.post(f"{NODE_API_URL}/manual-score", json={
                    "answerId": ans_id,
                    "manualScores": {
                        "technicalKnowledge": tech,
                        "depthCompleteness": depth,
                        "communication": comm,
                        "consistency": cons
                    },
                    "notes": expert_notes
                }).json()

                if res.get("success"):
                    st.success("Expert score recorded and integrated into weighted formula!")
                else:
                    st.error(f"Error: {res.get('error')}")
            except Exception as e:
                st.error(f"Error saving score: {e}")
