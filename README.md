### 🧑‍💻 HireSense - AI Powered Job Portal Web Application
---

[![Java](https://img.shields.io/badge/Java-17%2B-blue.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen?logo=spring-boot)](https://spring.io/projects/spring-boot)
[![Maven](https://img.shields.io/badge/Maven-3.8-orange?logo=apachemaven)](https://maven.apache.org/)
![LLM](https://img.shields.io/badge/LLM-Groq%20%7C%20LLaMA3-blueviolet)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue?logo=postgresql)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-4.x-ff69b4?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)



### 🚀 Project Overview
   A modern, full-stack job portal platform built with **Spring Boot (Java)** and **React + Vite**.  
   It allows **candidates** to browse and apply for jobs, **employers** to post and manage job listings, and **admins** to oversee the entire system.
   This project also includes optional AI capabilities via Groq api for resume analysis, AI job matching & scoring, candidate ranking, and job description generation.

    
------------------------------------------------------------------------------------------------------------
### ⭐ Features

  ### 🤖 AI Features (Powered by Groq)
   - **Smart Resume Analysis**: Automatically extracts skills, experience, and education from resumes.
   - **AI Job Matching**: Calculates a match score (0-100%) between candidates and job requirements.
   - **Automated Ranking**: Ranks applicants based on their relevance to the job description.
   - **Job Description Generator**: Helps employers create detailed job posts from simple prompts.
   - **AI Career Assistant**: A chat interface for career advice and interview preparation.

  #### 👨‍🎓 Candidates
  
   - Browse & filter jobs (location, type, experience, keywords)
   - View job details with company info
   - Apply with cover letter + resume upload
   - Track application status
   - Save jobs for later
   - Manage profile

  #### 👨‍💼 Employers
    
   - Create & manage job posts
   - View applicants per job
   - Update application status:
   - Pending → Reviewed → Shortlisted → Accepted → Rejected
   - Company profile management
   - Email notifications to candidates

  #### 🛡️ Admins

   - Manage users, companies, jobs, and applications
   - View platform-wide statistics
   - Complete system oversight
------------------------------------------------------------------------------------------------------------
### 🏗️ System Architecture
```mermaid
flowchart LR
    subgraph Client["🌐 Frontend (React + Vite)"]
        UI["User Interface (SPA)"]
    end

    subgraph Server["⚙️ Backend (Spring Boot)"]
        subgraph Controllers["REST Controllers"]
            AuthController["AuthController (/api/auth)"]
            UserController["UserController (/api/users)"]
            JobController["JobController (/api/jobs)"]
            CompanyController["CompanyController (/api/companies)"]
            ApplicationController["ApplicationController (/api/applications)"]
            FileController["FileController (/api/files)"]
            AIController["AIController (/api/ai)"]
            NotificationController["NotificationController (/api/notifications)"]
        end

        subgraph Services["Service Layer"]
            AuthService["AuthService (JWT)"]
            UserService["UserService"]
            JobService["JobService"]
            CompanyService["CompanyService"]
            ApplicationService["ApplicationService"]
            NotificationService["NotificationService"]
            EmailService["EmailService (SMTP)"]
            GroqAIService["GroqAIService (AI) "]
            ResumeParserService["ResumeParserService (PDF/DOC parsing)"]
        end
    end

    subgraph DB["🗄 PostgreSQL (data tables)"]
        Users[(users)]
        Candidates[(candidates)]
        Employers[(employers)]
        Companies[(companies)]
        Jobs[(jobs)]
        Applications[(applications)]
        SavedJobs[(saved_jobs)]
        ResumeAnalyses[(resume_analyses)]
        AIJobMatches[(ai_job_matches)]
        Notifications[(notifications)]
    end

    %% Client -> Controllers
    UI -->|API calls| AuthController
    UI -->|API calls| UserController
    UI -->|API calls| JobController
    UI -->|API calls| CompanyController
    UI -->|API calls| ApplicationController
    UI -->|API calls| FileController
    UI -->|API calls| AIController
    UI -->|API calls| NotificationController

    %% Controllers -> Services
    AuthController --> AuthService
    UserController --> UserService
    JobController --> JobService
    CompanyController --> CompanyService
    ApplicationController --> ApplicationService
    FileController --> ResumeParserService
    FileController --> FileStorage
    AIController --> GroqAIService
    NotificationController --> NotificationService

    %% Services -> DB / Storage
    AuthService --> Users
    UserService --> Users
    UserService --> Candidates
    UserService --> Employers
    CompanyService --> Companies
    JobService --> Jobs
    JobService --> Companies
    ApplicationService --> Applications
    ApplicationService --> Jobs
    ApplicationService --> Candidates
    ResumeParserService --> FileStorage
    GroqAIService --> AIJobMatches
    GroqAIService --> ResumeAnalyses
    GroqAIService --> Jobs
    GroqAIService --> Candidates
    NotificationService --> Notifications

```
-------------------------------------------------------------------------------------------------

## 📊 Data Model (ER Diagram)
```mermaid
erDiagram
  USER ||--|| CANDIDATE : "is"
  USER ||--|| EMPLOYER : "is"

  EMPLOYER }|--|| COMPANY : "works_for"
  COMPANY ||--|{ JOB : "offers"
  EMPLOYER ||--|{ JOB : "posts"

  JOB ||--|{ APPLICATION : "receives"
  CANDIDATE ||--|{ APPLICATION : "submits"

  CANDIDATE ||--|{ SAVEDJOB : "saves"
  JOB ||--|{ SAVEDJOB : "is_saved_as"

  CANDIDATE ||--|| RESUME_ANALYSIS : "has"

  CANDIDATE ||--|{ AI_JOB_MATCH : "has"
  JOB ||--|{ AI_JOB_MATCH : "analyzed_for"

  USER ||--o{ NOTIFICATION : "receives"

  USER {
    Long id PK
    String email
    String password
    Role role
    Boolean isActive
    LocalDateTime createdAt
    LocalDateTime updatedAt
  }
  CANDIDATE {
    Long id PK
    Long user_id FK
    String fullName
    String phone
    String location
    String skills
    String experience
    String education
    LocalDateTime createdAt
  }
  EMPLOYER {
    Long id PK
    Long user_id FK
    Long company_id FK
    String fullName
    String position
    String phone
    LocalDateTime createdAt
  }
  COMPANY {
    Long id PK
    String name
    String description
    String industry
    String location
    String website
    String logoUrl
    LocalDateTime createdAt
    LocalDateTime updatedAt
  }
  JOB {
    Long id PK
    Long company_id FK
    Long employer_id FK
    String title
    String description
    String requirements
    String location
    JobType jobType
    String salaryRange
    String experienceLevel
    JobStatus status
    LocalDate postedDate
    LocalDate closingDate
  }
  APPLICATION {
    Long id PK
    Long job_id FK
    Long candidate_id FK
    String coverLetter
    TEXT resumeText
    Integer aiMatchScore
    ApplicationStatus status
    LocalDateTime appliedDate
    LocalDateTime updatedAt
  }
  SAVEDJOB {
    Long id PK
    Long candidate_id FK
    Long job_id FK
    LocalDateTime savedAt
  }
  RESUME_ANALYSIS {
    Long id PK
    Long candidate_id FK
    TEXT resumeText
    String extractedSkills
    String experienceSummary
    String educationSummary
    String suggestedJobTitles
    String overallSummary
    LocalDateTime analyzedAt
  }
  AI_JOB_MATCH {
    Long id PK
    Long candidate_id FK
    Long job_id FK
    Integer matchScore
    String matchingSkills
    String missingSkills
    String strengthsSummary
    String recommendation
    LocalDateTime analyzedAt
  }
  NOTIFICATION {
    Long id PK
    Long userId
    String type
    String message
    Boolean isRead
    Long referenceId
    LocalDateTime createdAt
  }
```

----------------------------------------------------------------------------------------------
### 🔐 Authentication Flow
```mermaid
sequenceDiagram
  participant Candidate
  participant Frontend
  participant Backend
  participant AuthService
  participant UserRepo

  Candidate ->> Frontend: Enter email + password  
  Frontend ->> Backend: POST /api/auth/login  
  Backend ->> AuthService: Validate credentials  
  AuthService ->> UserRepo: Retrieve user data  
  UserRepo -->> AuthService: User found  
  AuthService ->> AuthService: Generate JWT  
  AuthService -->> Backend: Return JWT  
  Backend -->> Frontend: Send token + user info  
  Frontend ->> LocalStorage: Save JWT  
  Frontend -->> Candidate: Redirect to dashboard  
```
------------------------------------------------------------------------------------------------
### 📸 Screenshots

#### Landing Page
![Landing Page](screenshots/home.png)

#### Registration Page
![Registration Page](screenshots/register.png)

### Admin Panel
![Admin Panel](screenshots/admin.png)

### Job Posting 
![Post Job](screenshots/post-job.png)

### AI Rank Candidates 
![AI Rank Candidates](screenshots/airank.png)

### Employer 
![Employer](screenshots/employer.png)

### Apply Job   
![Apply Job](screenshots/apply.png)

### Candidate 
![Candidate](screenshots/candidate.png)

------------------------------------------------------------------------------------------------
### ✅ API Endpoints

### Authentication (`/api/auth`)
- POST `/api/auth/register` — Register a new user (body: RegisterRequest)
- POST `/api/auth/login` — Login & get JWT (body: LoginRequest)

### Users (`/api/users`)
- GET `/api/users/profile` — Get current user profile (Authenticated)
- PUT `/api/users/profile` — Update current user profile (Authenticated, body: ProfileUpdateRequest)
- PUT `/api/users/change-password` — Change password (Authenticated, body: PasswordChangeRequest)

### Jobs (`/api/jobs`)
- GET `/api/jobs` — Get all jobs (pagination + sorting) (Public)
- GET `/api/jobs/search` — Search jobs (keyword, location, jobType, experienceLevel, companyId, pagination) (Public)
- GET `/api/jobs/{id}` — Get job details (Public)
- POST `/api/jobs` — Create a job (Employer only, body: JobRequest)
- PUT `/api/jobs/{id}` — Update a job (Employer only, body: JobRequest)
- DELETE `/api/jobs/{id}` — Delete a job (Employer only)
- GET `/api/jobs/my-jobs` — Get employer's own posted jobs (Employer only)

### Companies (`/api/companies`)
- GET `/api/companies` — Get all companies (paginated) (Public)
- GET `/api/companies/{id}` — Get company details (Public)
- POST `/api/companies` — Create company (Admin only, body: CompanyRequest)
- PUT `/api/companies/{id}` — Update company (Admin only, body: CompanyRequest)
- DELETE `/api/companies/{id}` — Delete company (Admin only)

### Applications (`/api/applications`)
- POST `/api/applications` — Apply for a job (Candidate only, body: ApplicationRequest)
- GET `/api/applications/my-applications` — Get candidate applications (Candidate only)
- GET `/api/applications/job/{jobId}` — Get all applications for a job (Employer only)
- GET `/api/applications/{id}` — View application by ID (Candidate or Employer)
- PUT `/api/applications/{id}/status?status=STATUS` — Update application status (Employer only)

### Files (`/api/files`)
- POST `/api/files/upload` — Upload a file (authenticated). Params: `file` (multipart), optional `type` (resume/profile/document). Returns `fileUrl`, `fileName`, `fileType`.
- POST `/api/files/upload-resume` — Upload resume and return extracted text (authenticated). Returns `fileUrl`, `extractedText`, etc.
- GET `/api/files/download/{type}/{filename}` — Download/view a file (public for downloads)
- DELETE `/api/files/delete/{type}/{filename}` — Delete an uploaded file (authenticated)

### AI (Groq) (`/api/ai`)
- POST `/api/ai/analyze-resume` — Analyze resume text (body: AIResumeAnalysisRequest) (public)
- POST `/api/ai/analyze-resume/{candidateId}` — Analyze resume and store it for candidate (Candidate only, body: {"resumeText": "..."})
- GET `/api/ai/resume-analysis/{candidateId}` — Get stored resume analysis (public if accessible)
- POST `/api/ai/match-score` — Calculate match score ad-hoc (body: AIMatchScoreRequest)
- POST `/api/ai/match-score/{candidateId}/{jobId}` — Calculate & store match score (public)
- GET `/api/ai/match-score/{candidateId}/{jobId}` — Get stored match score (or calculate) (public)
- POST `/api/ai/analyze-job-match` — Analyze a resume against a job (Candidate only, body: {"resumeText","jobTitle","jobDescription","jobRequirements"})
- POST `/api/ai/generate-job-description` — Generate job description (Employer only, body: AIJobDescriptionRequest)
- POST `/api/ai/analyze-applicants/{jobId}` — Trigger batch analysis of applicants for a job (Employer only)
- GET `/api/ai/ranked-candidates/{jobId}` — Get ranked candidates for a job (Employer only)
- POST `/api/ai/chat` — AI chat assistant (public, body: AIChatRequest)

### Notifications (`/api/notifications`)
- GET `/api/notifications` — Get paginated notifications for the current user (Authenticated)
  - Query params: `page`, `size`
- GET `/api/notifications/unread` — Get unread notifications (Authenticated)
- GET `/api/notifications/unread/count` — Get unread count (Authenticated)
- PUT `/api/notifications/{id}/read` — Mark specific notification as read (Authenticated)
- PUT `/api/notifications/read-all` — Mark all notifications as read (Authenticated)
- DELETE `/api/notifications/{id}` — Delete a notification (Authenticated)
- DELETE `/api/notifications/clear-all` — Clear all notifications for the user (Authenticated)

  
-------------------------------------------------------------------------------------------------
### ⚙️ Tech Stack

 #### Backend
- Java 17
- Spring Boot 3
- Spring Security + JWT
- Spring Data JPA (Hibernate)
- PostgreSQL
- Groq AI Integration
- Maven
  
 #### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios

---------------------------------------------------------------------------------------------------
