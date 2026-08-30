import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import {
  User,
  Conversation,
  Message,
  CollegeDocument,
  DocumentChunk,
  AdminStats,
  DocumentCategory,
} from "../models/types.ts";
import { config } from "../config/config.ts";

interface DatabaseSchema {
  users: User[];
  conversations: Conversation[];
  messages: Message[];
  documents: CollegeDocument[];
  chunks: DocumentChunk[];
}

const DB_DIR = path.resolve(process.cwd(), config.dataDir);
const DB_FILE = path.join(DB_DIR, "db.json");
const UPLOADS_DIR = path.resolve(process.cwd(), config.uploadsDir);

// Initial realistic Demo College Data for instant rich RAG functionality
const initialDocuments: Array<{
  doc: Omit<CollegeDocument, "id" | "createdAt" | "updatedAt">;
  chunks: Array<{ text: string; pageNumber: number; heading: string }>;
}> = [
  {
    doc: {
      name: "Student Academic Handbook & Regulations (2025-2026)",
      originalName: "academic_regulations_2025_2026.pdf",
      category: "Academics",
      fileType: "application/pdf",
      fileSize: 485200,
      storagePath: "uploads/academic_regulations_2025_2026.pdf",
      uploadedBy: "system",
      uploadedByName: "Academic Registrar",
      processingStatus: "ready",
      chunkCount: 6,
      pageCount: 18,
      description: "Comprehensive guide covering attendance mandates, grading policy, credit requirements, and academic probation rules.",
    },
    chunks: [
      {
        pageNumber: 3,
        heading: "Attendance Requirements and Condonation",
        text: "Section 3.1 Attendance Requirement: Every registered student must maintain a minimum mandatory attendance of 75% in each course (lectures, tutorials, and laboratories) to be eligible to appear for the End-Semester Examination. Students with attendance between 65% and 74.9% may apply for attendance condonation solely on genuine medical grounds, supported by valid hospital certificates submitted within 7 working days to the Dean of Academic Affairs. Condonation carries a standard administrative fee of $25 per course. Students with less than 65% attendance are awarded a 'Grade FA' (Failure due to low Attendance) and must mandatorily re-register for the course in the supplementary semester.",
      },
      {
        pageNumber: 6,
        heading: "Grading Scale and CGPA Calculation",
        text: "Section 5.2 Grading System: The Institute follows a 10-point relative letter grading system. Grades are assigned as: O (Outstanding - 10 pts, 90-100%), A+ (Excellent - 9 pts, 80-89%), A (Very Good - 8 pts, 70-79%), B+ (Good - 7 pts, 60-69%), B (Above Average - 6 pts, 50-59%), C (Pass - 5 pts, 40-49%), and F (Fail - 0 pts, <40%). The Cumulative Grade Point Average (CGPA) is calculated at the end of each semester as the weighted average of credits earned. To graduate with an Honors degree, a candidate must maintain a minimum CGPA of 8.5 without any backlogs in any semester.",
      },
      {
        pageNumber: 9,
        heading: "Course Registration and Drop Deadlines",
        text: "Section 4.4 Course Add/Drop Period: Students are allowed to modify their elective course registrations during the first two weeks of each semester via the Student Academic Portal. The final date for dropping a course without academic penalty or notation on the official transcript is the end of the 4th instructional week. Beyond the 4th week, dropping a course requires written approval from the Department Head and will result in a 'W' (Withdrawn) grade recorded on the grade sheet.",
      },
      {
        pageNumber: 12,
        heading: "Academic Probation and Remedial Program",
        text: "Section 8.1 Academic Standing: A student whose Semester GPA (SGPA) falls below 5.0 in any semester or whose overall CGPA is below 5.25 is placed on Academic Probation. Students on probation are assigned a dedicated faculty mentor, restricted to a maximum course load of 18 credits for the subsequent term, and are required to attend bi-weekly peer tutoring and remedial workshops organized by the Academic Learning Center.",
      },
      {
        pageNumber: 15,
        heading: "Credit Transfers and MOOC Policy",
        text: "Section 10.3 Online Courses & NPTEL/Coursera Credit Transfer: Under the institute curriculum flexibility framework, undergraduate students may earn up to a maximum of 12 credits (equivalent to 3 elective courses) through pre-approved online MOOC certifications (NPTEL, SWAYAM, edX). Prior written approval from the Department Academic Committee (DAC) is mandatory before course registration. Only certificates with proctored examination scores above 60% are accepted for transfer credit.",
      },
      {
        pageNumber: 17,
        heading: "Degree Award Requirements",
        text: "Section 12.1 Graduation Eligibility: For the award of the B.Tech / B.S. degree, a candidate must successfully complete all prescribed foundational, core, and elective courses totaling a minimum of 160 credits, maintain an overall CGPA of at least 5.0, earn 40 hours of approved Community Service/NSS credits, and have no outstanding dues or disciplinary sanctions with the Institute.",
      },
    ],
  },
  {
    doc: {
      name: "Hostel Administration & Residence Rules (2025-2026)",
      originalName: "hostel_rules_and_regulations.pdf",
      category: "Hostel",
      fileType: "application/pdf",
      fileSize: 392000,
      storagePath: "uploads/hostel_rules_and_regulations.pdf",
      uploadedBy: "system",
      uploadedByName: "Chief Warden Office",
      processingStatus: "ready",
      chunkCount: 5,
      pageCount: 14,
      description: "Official rules governing hostel allocation, curfew hours, visitor policies, mess timings, and resident code of conduct.",
    },
    chunks: [
      {
        pageNumber: 2,
        heading: "Hostel Admission and Room Allocation Process",
        text: "Chapter 1: Hostel Admission: All full-time enrolled students residing beyond 35 km from campus are eligible for hostel accommodation on campus. Room allotments are conducted online at the beginning of each academic year based on academic seniority and distance criteria. Rooms are double-occupancy for 1st and 2nd-year students and single-occupancy for 3rd and final-year students. Students must deposit a refundable security deposit of $150 alongside the semester room fee of $450.",
      },
      {
        pageNumber: 5,
        heading: "Curfew Timings and Night Pass Regulations",
        text: "Chapter 3: Curfew and Security: All hostel resident gates close promptly at 10:00 PM on weekdays (Sunday to Thursday) and 10:30 PM on weekends (Friday and Saturday). Biometric attendance is recorded at each hostel entrance between 9:45 PM and 10:15 PM. Students requiring to leave campus overnight or for weekend visits must submit an electronic Night Out Pass via the Hostel Portal at least 24 hours in advance, counter-approved by their registered guardian or parent.",
      },
      {
        pageNumber: 7,
        heading: "Mess Services and Dining Schedule",
        text: "Chapter 4: Dining Services & Mess Timings: The central dining halls serve hygienic vegetarian and non-vegetarian meals under the supervision of the Student Mess Committee. Schedule: Breakfast: 7:15 AM - 9:00 AM; Lunch: 12:15 PM - 2:00 PM; Evening Tea & Snacks: 4:30 PM - 5:30 PM; Dinner: 7:30 PM - 9:30 PM. Mess fee rebates of 80% daily cost are granted for leaves exceeding 4 consecutive days with approved leave applications.",
      },
      {
        pageNumber: 10,
        heading: "Electrical Appliances and Room Inspections",
        text: "Chapter 6: Prohibited Items & Safety: Use of heavy electrical appliances including electric heaters, immersion rods, hot plates, induction cookers, air conditioners, and subwoofers inside student rooms is strictly prohibited. Authorized items include laptops, desktop computers, mobile chargers, study lamps, and hair dryers. The Warden and Security Squad reserve the right to conduct surprise room inspections for fire safety and maintenance.",
      },
      {
        pageNumber: 13,
        heading: "Guest Policy and Anti-Ragging Measures",
        text: "Chapter 8: Visitor Regulations and Zero Tolerance Policy: Day visitors (parents/siblings) are permitted only in the designated Hostel Visitor Lounge between 4:00 PM and 7:00 PM on weekdays and 10:00 AM to 7:00 PM on weekends. Overnight stay of unauthorized guests inside student rooms constitutes a serious disciplinary breach attracting an immediate fine of $100 and potential eviction. The Institute maintains a strict Zero Tolerance policy towards ragging and harassment.",
      },
    ],
  },
  {
    doc: {
      name: "Central Library Rules, Timings & Digital Access Guide",
      originalName: "library_rules_and_digital_access.pdf",
      category: "Library",
      fileType: "application/pdf",
      fileSize: 310500,
      storagePath: "uploads/library_rules_and_digital_access.pdf",
      uploadedBy: "system",
      uploadedByName: "Chief Librarian",
      processingStatus: "ready",
      chunkCount: 4,
      pageCount: 10,
      description: "Guidelines on borrowing quotas, opening hours, overdue fines, online database subscriptions (IEEE, Springer, ScienceDirect), and study rooms.",
    },
    chunks: [
      {
        pageNumber: 1,
        heading: "Central Library Operating Hours",
        text: "Section 1: Operating Hours: The Central Library operates on all days throughout the academic year. Regular Term Timings: Monday to Friday: 8:00 AM to 10:00 PM; Saturday and Sunday: 9:00 AM to 6:00 PM. During Mid-Semester and End-Semester Examination periods, the 2nd-floor Air-Conditioned Reading Hall remains open 24 hours with valid student ID card swipe access. Library services remain closed only on designated national holidays.",
      },
      {
        pageNumber: 3,
        heading: "Borrowing Privileges and Book Quotas",
        text: "Section 2: Lending Policy: Undergraduate students are entitled to borrow up to 4 books simultaneously for a duration of 14 calendar days. Postgraduate students may borrow up to 6 books for 21 days, and Research Scholars may borrow 8 books for 30 days. Books may be renewed once for an additional 14-day period online through the OPAC portal, provided no other student has placed an active reservation hold.",
      },
      {
        pageNumber: 5,
        heading: "Overdue Fines, Loss of Material, and Inter-Library Loan",
        text: "Section 3: Overdue Penalties: An overdue fine of $0.50 per book per day is charged for the first 7 overdue days, escalating to $1.00 per book per day thereafter. In case of lost or irreparably damaged books, the borrower must either replace the book with the latest edition or pay twice the current market cost of the book plus an administrative processing charge of $10.",
      },
      {
        pageNumber: 8,
        heading: "Digital Resource Center & Remote Journal Access",
        text: "Section 5: Digital Library & E-Resources: Students have 24/7 access to over 15,000 peer-reviewed e-journals and conference proceedings including IEEE Xplore, ACM Digital Library, SpringerLink, ScienceDirect, and JSTOR through the EZproxy remote login system using institutional credentials. The 3rd-floor Digital Lab provides 60 high-speed computer terminals and printing/scanning facilities at subsidized rates.",
      },
    ],
  },
  {
    doc: {
      name: "Examination Circular & Evaluation Framework (2025-2026)",
      originalName: "examination_circular_and_regulations.pdf",
      category: "Examinations",
      fileType: "application/pdf",
      fileSize: 420000,
      storagePath: "uploads/examination_circular_and_regulations.pdf",
      uploadedBy: "system",
      uploadedByName: "Controller of Examinations",
      processingStatus: "ready",
      chunkCount: 4,
      pageCount: 12,
      description: "Official circular regarding continuous internal assessment (CIA), end-semester exam dates, revaluation procedures, and supplementary exams.",
    },
    chunks: [
      {
        pageNumber: 2,
        heading: "Assessment Breakdown & Internal Weightage",
        text: "Article 2: Evaluation Scheme: Course performance is assessed through Continuous Internal Assessment (CIA - 40% weightage) and the End-Semester Examination (ESE - 60% weightage). CIA consists of two centralized Mid-Term Tests (20 marks), Quizzes and Assignments (10 marks), and Mini-Projects/Case Studies (10 marks). A student must secure a minimum of 40% marks in both CIA and ESE separately, with an aggregate score of at least 45%, to pass any theory course.",
      },
      {
        pageNumber: 4,
        heading: "Examination Schedule and Hall Ticket Rules",
        text: "Article 4: Examination Schedule & Hall Tickets: The Autumn Semester End-Term Examinations commence on November 18, 2025 and conclude on December 5, 2025. The Spring Semester Examinations commence on April 22, 2026 and conclude on May 10, 2026. Hall tickets are generated electronically on the examination portal 10 days prior to commencement. No student is admitted into the examination hall without a physical printed hall ticket and valid college identity card.",
      },
      {
        pageNumber: 7,
        heading: "Revaluation and Answer Script Verification",
        text: "Article 6: Paper Re-Checking & Revaluation: Students dissatisfied with their evaluation may apply for Photocopy of Answer Scripts within 10 days of results declaration with a fee of $15 per paper. Applications for formal Revaluation must be submitted within 7 days of receiving the photocopy accompanied by a fee of $30 per course. If the revaluation mark increases by 10% or more, 50% of the revaluation fee is refunded.",
      },
      {
        pageNumber: 9,
        heading: "Supplementary Examinations & Malpractice Penalty",
        text: "Article 8: Supplementary Exams & Examination Malpractice: Supplementary (arrear) examinations for failed courses are conducted during the summer break (June 15 - June 30). In cases of academic malpractice (possession of cheat sheets, electronic gadgets, smartwatches, or communication devices during exams), the Standing Examination Malpractice Committee may debar the candidate from the subject or cancel all examinations of that semester.",
      },
    ],
  },
  {
    doc: {
      name: "Scholarships, Financial Aid & Merit Awards (2025-2026)",
      originalName: "scholarships_and_financial_aid_2025.pdf",
      category: "Scholarships",
      fileType: "application/pdf",
      fileSize: 340000,
      storagePath: "uploads/scholarships_and_financial_aid_2025.pdf",
      uploadedBy: "system",
      uploadedByName: "Financial Aid Committee",
      processingStatus: "ready",
      chunkCount: 4,
      pageCount: 11,
      description: "Detailed eligibility criteria, award amounts, deadlines, and application procedures for institute merit scholarships, fee waivers, and government schemes.",
    },
    chunks: [
      {
        pageNumber: 2,
        heading: "Institute Merit-cum-Means (MCM) Scholarship",
        text: "Section 1: Merit-cum-Means (MCM) Scholarship: Awarded to the top 10% of undergraduate students in each engineering branch. Eligibility: Gross annual family income from all sources must not exceed $8,000 (INR 6.5 Lakhs equivalent), and the student must maintain a minimum CGPA of 7.5 with no standing backlogs. The award covers a 100% tuition fee waiver plus a monthly maintenance stipend of $120 for 10 months each academic year.",
      },
      {
        pageNumber: 4,
        heading: "Chairman's Academic Excellence Award",
        text: "Section 2: Chairman's Merit Fellowship: Top 3 rank holders across each academic department with a CGPA of 9.25 or higher receive a one-time annual cash prize: 1st Rank: $1,500 cash reward + Commendation Certificate; 2nd Rank: $1,000 cash reward; 3rd Rank: $600 cash reward. The awards are conferred annually during the Institute Foundation Day ceremony on September 15.",
      },
      {
        pageNumber: 7,
        heading: "Sports & Diversity Financial Support",
        text: "Section 4: Sports and Special Category Grants: Students representing the Institute in National or Inter-University sports tournaments receive a 50% tuition waiver and reimbursement for travel, athletic kit, and specialized coaching. Women in STEM scholarships provide a $1,000 annual fellowship for female students enrolling in Computer Science, Electrical, and Mechanical engineering disciplines.",
      },
      {
        pageNumber: 9,
        heading: "Application Timelines & Submission Process",
        text: "Section 6: Important Scholarship Deadlines: Online portal for scholarship applications opens on August 15 each year and closes on September 30. Required documents: Income Tax returns or Revenue Department income certificate of parents, certified bank passbook copies, high school and latest semester grade sheets, and bonafide student certificate. Disbursal of approved scholarships takes place by October 31 directly to student bank accounts.",
      },
    ],
  },
  {
    doc: {
      name: "Campus Placements & Internship Policy (2025-2026)",
      originalName: "placement_and_internship_policy.pdf",
      category: "Placements",
      fileType: "application/pdf",
      fileSize: 410000,
      storagePath: "uploads/placement_and_internship_policy.pdf",
      uploadedBy: "system",
      uploadedByName: "Head of Training & Placement",
      processingStatus: "ready",
      chunkCount: 4,
      pageCount: 15,
      description: "Official rules governing eligibility criteria, dream job offers, internship credits, campus recruitment etiquette, and offer acceptance protocols.",
    },
    chunks: [
      {
        pageNumber: 3,
        heading: "Placement Eligibility & Registration Criteria",
        text: "Policy Section 1: Registration Criteria: All final-year students with a minimum CGPA of 6.0 and no active backlogs are eligible to register with the Training & Placement Cell (T&P) by paying a nominal annual registration fee of $30. Placement drives are categorized into Tier 1 (Base packages up to $10,000/yr), Tier 2 (Dream packages between $10,000 and $25,000/yr), and Super Dream (Packages exceeding $25,000/yr).",
      },
      {
        pageNumber: 6,
        heading: "One Student One Job Policy & Dream Offer Upgrades",
        text: "Policy Section 3: Offer Acceptance & Upgrades: The Institute strictly follows the 'One Student, One Job' policy to ensure equitable placement opportunities for all graduates. However, a student holding a Tier 1 offer is permitted up to 2 upgrade attempts for Tier 2 or Super Dream companies. Once a student receives a Super Dream offer, their candidature is marked as permanently placed, and they are not eligible for subsequent campus recruitment drives.",
      },
      {
        pageNumber: 9,
        heading: "Mandatory Summer Internship & Pre-Placement Offers (PPO)",
        text: "Policy Section 5: Internship Guidelines: All undergraduate students must undergo a compulsory 8 to 12-week industrial internship during the summer vacation after the 6th semester. The internship carries 4 academic credits. Students receiving Pre-Placement Offers (PPO) from their internship employer must notify the T&P Cell within 7 days of receipt. Accepting a PPO of Super Dream caliber counts as final placement.",
      },
      {
        pageNumber: 12,
        heading: "Code of Conduct and Blacklisting Policies",
        text: "Policy Section 8: Code of Conduct: Attendance is strictly mandatory for any recruitment test or interview for which a student has registered. Unannounced absence from a registered drive, impersonation, or turning down a confirmed offer results in immediate blacklisting from all future on-campus placement opportunities for the rest of the academic session.",
      },
    ],
  },
  {
    doc: {
      name: "Undergraduate & Postgraduate Admission Prospectus",
      originalName: "admission_prospectus_and_guidelines.pdf",
      category: "Admissions",
      fileType: "application/pdf",
      fileSize: 520000,
      storagePath: "uploads/admission_prospectus_and_guidelines.pdf",
      uploadedBy: "system",
      uploadedByName: "Admissions Directorate",
      processingStatus: "ready",
      chunkCount: 4,
      pageCount: 16,
      description: "Information regarding entrance exams, eligibility benchmarks, required verification documents, fee structures, and refund rules.",
    },
    chunks: [
      {
        pageNumber: 2,
        heading: "Undergraduate Admission Eligibility & Entrance Exams",
        text: "Chapter 2: B.Tech / B.E. Eligibility: Candidates must have passed the 10+2 or equivalent board examination with a minimum of 60% aggregate marks (55% for reserved categories) in Physics, Mathematics, and Chemistry/Computer Science. Admission is offered through national entrance merit rankings (JEE Main / State CET) or through the Institute Entrance Examination (CampusIQ-CET) conducted in May each year.",
      },
      {
        pageNumber: 5,
        heading: "Mandatory Verification Documents",
        text: "Chapter 4: Document Verification Checklist: At the time of physical counseling, candidates must submit original and two sets of self-attested photocopies of: 1) Class 10th and 12th Marksheets & Passing Certificates; 2) Entrance Examination Scorecard & Admit Card; 3) Transfer Certificate (TC) & Conduct Certificate from the previous institution; 4) Migration Certificate; 5) Category/Caste Certificate (if applicable); 6) Medical Fitness Certificate issued by a registered medical practitioner; 7) 6 passport-sized photographs; 8) Proof of permanent residence / Identity card.",
      },
      {
        pageNumber: 8,
        heading: "Annual Tuition Fee Structure & Payment Terms",
        text: "Chapter 6: Fee Structure (Annual): Tuition Fee: $3,200 per year; Development Fee: $400; Examination & Lab Fee: $250; Library & Digital Resources Fee: $150; One-time Admission & Alumni Fee: $200 (payable only in first year). Fees may be paid in two equal semester installments via online payment gateway, Net Banking, or Demand Draft drawn in favor of 'CampusIQ Institute of Technology'.",
      },
      {
        pageNumber: 11,
        heading: "Admission Cancellation & Fee Refund Policy",
        text: "Chapter 8: Cancellation & Refund Policy: If a candidate withdraws admission 15 days or more before the formal commencement of classes, 100% of the tuition fee is refunded after deducting a maximum processing fee of $20. If withdrawn within 15 days after classes start, 80% tuition is refunded. Beyond 30 days after commencement of classes, only the refundable caution deposit is returned.",
      },
    ],
  },
];

class DatabaseService {
  private data: DatabaseSchema = {
    users: [],
    conversations: [],
    messages: [],
    documents: [],
    chunks: [],
  };
  private initialized = false;

  constructor() {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  public async init() {
    if (this.initialized) return;
    this.ensureDirectories();

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        console.log(`[DB] Loaded ${this.data.documents.length} documents, ${this.data.chunks.length} chunks from ${DB_FILE}`);
      } catch (err) {
        console.error("[DB] Error reading existing database file, re-initializing:", err);
        await this.seedInitialData();
      }
    } else {
      await this.seedInitialData();
    }

    // Ensure default admin user and sample student user exist
    await this.ensureDefaultUsers();
    this.initialized = true;
  }

  private async ensureDefaultUsers() {
    const adminEmail = "admin@campusiq.edu";
    const studentEmail = "student@campusiq.edu";

    const adminExists = this.data.users.find((u) => u.email.toLowerCase() === adminEmail.toLowerCase());
    if (!adminExists) {
      const passwordHash = await bcrypt.hash("Admin@123", 10);
      this.data.users.push({
        id: "usr_admin_001",
        name: "Dr. Eleanor Vance",
        email: adminEmail,
        passwordHash,
        role: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const studentExists = this.data.users.find((u) => u.email.toLowerCase() === studentEmail.toLowerCase());
    if (!studentExists) {
      const passwordHash = await bcrypt.hash("Student@123", 10);
      this.data.users.push({
        id: "usr_student_001",
        name: "Kanagaraj",
        email: studentEmail,
        passwordHash,
        role: "student",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    this.save();
  }

  private async seedInitialData() {
    console.log("[DB] Seeding realistic official college documents and RAG knowledge base...");
    this.data = {
      users: [],
      conversations: [],
      messages: [],
      documents: [],
      chunks: [],
    };

    // Pre-calculate seeded docs and chunks
    for (let i = 0; i < initialDocuments.length; i++) {
      const item = initialDocuments[i];
      const docId = `doc_${String(i + 1).padStart(3, "0")}`;
      const now = new Date(Date.now() - (initialDocuments.length - i) * 86400000).toISOString();

      const document: CollegeDocument = {
        id: docId,
        name: item.doc.name,
        originalName: item.doc.originalName,
        category: item.doc.category,
        fileType: item.doc.fileType,
        fileSize: item.doc.fileSize,
        storagePath: item.doc.storagePath,
        uploadedBy: item.doc.uploadedBy,
        uploadedByName: item.doc.uploadedByName,
        processingStatus: item.doc.processingStatus,
        chunkCount: item.chunks.length,
        pageCount: item.doc.pageCount,
        description: item.doc.description,
        createdAt: now,
        updatedAt: now,
      };

      this.data.documents.push(document);

      item.chunks.forEach((c, cIdx) => {
        const chunkId = `chk_${docId}_${String(cIdx + 1).padStart(3, "0")}`;
        const chunk: DocumentChunk = {
          id: chunkId,
          documentId: docId,
          documentName: document.name,
          category: document.category,
          text: c.text,
          embedding: [], // Will be populated dynamically or via keyword vector fallback
          pageNumber: c.pageNumber,
          chunkIndex: cIdx + 1,
          metadata: {
            sectionHeading: c.heading,
            wordCount: c.text.split(/\s+/).length,
          },
          createdAt: now,
        };
        this.data.chunks.push(chunk);
      });
    }

    this.save();
  }

  public save() {
    try {
      this.ensureDirectories();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("[DB] Failed to persist data to disk:", err);
    }
  }

  // User APIs
  public async findUserByEmail(email: string): Promise<User | undefined> {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public async findUserById(id: string): Promise<User | undefined> {
    return this.data.users.find((u) => u.id === id);
  }

  public async createUser(user: User): Promise<User> {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.users[idx];
  }

  // Conversation APIs
  public async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return this.data.conversations
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public async getConversationById(id: string): Promise<Conversation | undefined> {
    return this.data.conversations.find((c) => c.id === id);
  }

  public async createConversation(conversation: Conversation): Promise<Conversation> {
    this.data.conversations.push(conversation);
    this.save();
    return conversation;
  }

  public async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | null> {
    const idx = this.data.conversations.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.conversations[idx] = {
      ...this.data.conversations[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.conversations[idx];
  }

  public async deleteConversation(id: string): Promise<boolean> {
    const initialLen = this.data.conversations.length;
    this.data.conversations = this.data.conversations.filter((c) => c.id !== id);
    this.data.messages = this.data.messages.filter((m) => m.conversationId !== id);
    this.save();
    return this.data.conversations.length < initialLen;
  }

  // Message APIs
  public async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return this.data.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public async createMessage(message: Message): Promise<Message> {
    this.data.messages.push(message);
    // Update conversation updatedAt
    const conv = this.data.conversations.find((c) => c.id === message.conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
    }
    this.save();
    return message;
  }

  // Document APIs
  public async getDocuments(query?: { search?: string; category?: string; status?: string }): Promise<CollegeDocument[]> {
    let docs = [...this.data.documents];
    if (query?.category && query.category !== "All") {
      docs = docs.filter((d) => d.category.toLowerCase() === query.category!.toLowerCase());
    }
    if (query?.status && query.status !== "All") {
      docs = docs.filter((d) => d.processingStatus.toLowerCase() === query.status!.toLowerCase());
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.originalName.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q))
      );
    }
    return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getDocumentById(id: string): Promise<CollegeDocument | undefined> {
    return this.data.documents.find((d) => d.id === id);
  }

  public async createDocument(doc: CollegeDocument): Promise<CollegeDocument> {
    this.data.documents.push(doc);
    this.save();
    return doc;
  }

  public async updateDocument(id: string, updates: Partial<CollegeDocument>): Promise<CollegeDocument | null> {
    const idx = this.data.documents.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    this.data.documents[idx] = {
      ...this.data.documents[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.documents[idx];
  }

  public async deleteDocument(id: string): Promise<boolean> {
    const doc = this.data.documents.find((d) => d.id === id);
    if (!doc) return false;
    this.data.documents = this.data.documents.filter((d) => d.id !== id);
    this.data.chunks = this.data.chunks.filter((c) => c.documentId !== id);
    this.save();
    return true;
  }

  // Document Chunk APIs
  public async getChunksByDocumentId(documentId: string): Promise<DocumentChunk[]> {
    return this.data.chunks.filter((c) => c.documentId === documentId);
  }

  public async getAllReadyChunks(): Promise<DocumentChunk[]> {
    const readyDocIds = new Set(
      this.data.documents.filter((d) => d.processingStatus === "ready").map((d) => d.id)
    );
    return this.data.chunks.filter((c) => readyDocIds.has(c.documentId));
  }

  public async addChunks(chunks: DocumentChunk[]): Promise<void> {
    this.data.chunks.push(...chunks);
    this.save();
  }

  public async deleteChunksByDocumentId(documentId: string): Promise<void> {
    this.data.chunks = this.data.chunks.filter((c) => c.documentId !== documentId);
    this.save();
  }

  // Admin Stats
  public async getAdminStats(): Promise<AdminStats> {
    const totalDocs = this.data.documents.length;
    const readyDocs = this.data.documents.filter((d) => d.processingStatus === "ready").length;
    const processingDocs = this.data.documents.filter((d) => d.processingStatus === "processing").length;
    const failedDocs = this.data.documents.filter((d) => d.processingStatus === "failed").length;
    const totalChunks = this.data.chunks.length;
    const totalConversations = this.data.conversations.length;
    const totalQuestionsAnswered = this.data.messages.filter((m) => m.role === "assistant").length;
    const recentUploads = [...this.data.documents]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalDocuments: totalDocs,
      readyDocuments: readyDocs,
      processingDocuments: processingDocs,
      failedDocuments: failedDocs,
      totalIndexedChunks: totalChunks,
      totalConversations,
      totalQuestionsAnswered,
      recentUploads,
    };
  }
}

export const db = new DatabaseService();
