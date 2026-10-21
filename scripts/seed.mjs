import { Pool } from "pg";
import crypto from "crypto";

const pool = new Pool({ connectionString: "postgresql://postgres:postgres@127.0.0.1:5432/app_db" });

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function daysFromNow(days, hours = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clear existing data
    await client.query("DELETE FROM messages; DELETE FROM splits; DELETE FROM expenses; DELETE FROM budgets; DELETE FROM progress; DELETE FROM assignments; DELETE FROM exams; DELETE FROM classes; DELETE FROM subjects; DELETE FROM sessions; DELETE FROM users CASCADE; DELETE FROM notices; DELETE FROM lost_found; DELETE FROM projects; DELETE FROM resources; DELETE FROM clubs;");

    // Demo user
    const hash = hashPassword("demo1234");
    const userResult = await client.query(
      "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'student') RETURNING id",
      ["demo@campus.edu", hash, "Demo Student"]
    );
    const userId = userResult.rows[0].id;

    // Faculty user
    const facultyHash = hashPassword("faculty1234");
    const facultyResult = await client.query(
      "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'faculty') RETURNING id",
      ["faculty@campus.edu", facultyHash, "Prof. Sharma"]
    );
    const facultyId = facultyResult.rows[0].id;

    // Budget
    await client.query("INSERT INTO budgets (user_id, monthly_limit) VALUES ($1, 10000)", [userId]);

    // Subjects
    const subjects = [
      ["DSA", "#6366f1", "Data Structures & Algorithms"],
      ["DBMS", "#10b981", "Database Management Systems"],
      ["OS", "#f59e0b", "Operating Systems"],
      ["CN", "#ef4444", "Computer Networks"],
      ["ML", "#8b5cf6", "Machine Learning"],
    ];
    const subjectIds = [];
    for (const [name, color, desc] of subjects) {
      const r = await client.query("INSERT INTO subjects (user_id, name, color, description) VALUES ($1, $2, $3, $4) RETURNING id", [userId, name, color, desc]);
      subjectIds.push(r.rows[0].id);
    }

    // Classes (Mon=1, Tue=2, etc.)
    const classes = [
      [subjectIds[0], "DSA Lecture", 1, "09:00", "10:30", "Room 201", "Prof. Verma"],
      [subjectIds[1], "DBMS Lab", 1, "11:00", "12:30", "Lab 3", "Dr. Patel"],
      [subjectIds[2], "OS Lecture", 2, "09:00", "10:30", "Room 105", "Prof. Sharma"],
      [subjectIds[3], "CN Lecture", 2, "14:00", "15:30", "Room 210", "Dr. Iyer"],
      [subjectIds[4], "ML Workshop", 3, "10:00", "12:00", "Lab 5", "Prof. Khan"],
      [subjectIds[0], "DSA Tutorial", 4, "14:00", "15:30", "Room 201", "Prof. Verma"],
      [subjectIds[1], "DBMS Lecture", 4, "09:00", "10:30", "Room 105", "Dr. Patel"],
      [subjectIds[2], "OS Lab", 5, "14:00", "16:00", "Lab 3", "Prof. Sharma"],
    ];
    for (const [sid, title, day, start, end, room, teacher] of classes) {
      await client.query("INSERT INTO classes (user_id, subject_id, title, day_of_week, start_time, end_time, room, teacher) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [userId, sid, title, day, start, end, room, teacher]);
    }

    // Exams
    const exams = [
      [subjectIds[0], "DSA Mid-Term", 7, "Room 201", 100],
      [subjectIds[1], "DBMS Quiz", 14, "Lab 3", 50],
      [subjectIds[2], "OS End-Term", 21, "Room 105", 100],
      [subjectIds[4], "ML Project Demo", 30, "Lab 5", 100],
    ];
    for (const [sid, title, daysOffset, room, marks] of exams) {
      await client.query("INSERT INTO exams (user_id, subject_id, title, exam_date, room, marks) VALUES ($1,$2,$3,$4,$5,$6)", [userId, sid, title, daysFromNow(daysOffset, 9), room, marks]);
    }

    // Assignments
    const assignments = [
      [subjectIds[0], "DSA Assignment 3 - Trees", "Implement BST traversal and balancing algorithms.", 2, "pending", 100],
      [subjectIds[1], "DBMS Assignment 2 - SQL", "Write complex SQL queries with joins and subqueries.", 4, "pending", 100],
      [subjectIds[2], "OS Assignment 1 - Processes", "Implement process scheduling simulation.", 6, "pending", 100],
      [subjectIds[0], "DSA Assignment 2 - Sorting", "Implement and benchmark sorting algorithms.", -1, "submitted", 100],
      [subjectIds[3], "CN Assignment 1 - Network Layer", "Calculate subnet masks and routing tables.", 9, "pending", 100],
      [subjectIds[4], "ML Assignment 1 - Linear Regression", "Build a linear regression model from scratch.", 12, "pending", 100],
    ];
    for (const [sid, title, desc, daysOffset, status, marksTotal] of assignments) {
      await client.query("INSERT INTO assignments (user_id, subject_id, title, description, due_date, status, marks_total) VALUES ($1,$2,$3,$4,$5,$6,$7)", [userId, sid, title, desc, daysFromNow(daysOffset, 23), status, marksTotal]);
    }

    // Progress
    const progress = [
      [subjectIds[0], 12, 8],
      [subjectIds[1], 10, 7],
      [subjectIds[2], 15, 6],
      [subjectIds[3], 8, 4],
      [subjectIds[4], 10, 9],
    ];
    for (const [sid, total, done] of progress) {
      await client.query("INSERT INTO progress (user_id, subject_id, chapters_total, chapters_done) VALUES ($1,$2,$3,$4)", [userId, sid, total, done]);
    }

    // Expenses
    const expenses = [
      ["food", 250, "Lunch at mess", 0],
      ["food", 180, "Coffee & snacks", 0],
      ["travel", 50, "Bus to college", 0],
      ["stationery", 350, "Notebooks & pens", -1],
      ["food", 320, "Dinner with friends", -1],
      ["food", 200, "Breakfast", -2],
      ["travel", 100, "Auto to market", -2],
      ["other", 500, "Print notes", -3],
      ["food", 280, "Lunch", -3],
      ["stationery", 150, "Highlighters", -4],
      ["food", 220, "Snacks", -5],
      ["travel", 60, "Metro pass top-up", -5],
    ];
    let expenseId = 0;
    for (const [cat, amt, desc, daysOffset] of expenses) {
      expenseId++;
      const r = await client.query("INSERT INTO expenses (user_id, category, amount, description, spent_at) VALUES ($1,$2,$3,$4,$5) RETURNING id", [userId, cat, amt, desc, daysFromNow(daysOffset, 12)]);
      const eid = r.rows[0].id;
      // Split first expense (lunch) among 3 friends
      if (expenseId === 1) {
        await client.query("INSERT INTO splits (expense_id, user_id, amount) VALUES ($1,$2,$3)", [eid, userId, 83]);
        await client.query("INSERT INTO splits (expense_id, user_id, amount) VALUES ($1,$2,$3)", [eid, facultyId, 83]);
        await client.query("INSERT INTO splits (expense_id, user_id, amount) VALUES ($1,$2,$3)", [eid, userId, 84]);
      }
    }

    // Notices
    const notices = [
      ["announcement", "Library Timing Extended During Exams", "The central library will remain open until 11 PM during the mid-term examination period. Students can use the reading hall on the 2nd floor for late-night studying.", "faculty@campus.edu", facultyId, null, null],
      ["event", "Annual Tech Fest 'TechVerse 2026'", "Registrations are open for the biggest tech fest of the year! events include code-battle, hackathon, robotics expo, and AI workshops. Early bird registration ends this Friday.", "faculty@campus.edu", facultyId, daysFromNow(7), "Main Auditorium"],
      ["hackathon", "Hackathon: Build for Bharat", "48-hour hackathon focused on solving real-world problems for rural India. Prizes worth ₹1,00,000. Teams of 3-5. Register at the Innovation Center.", "faculty@campus.edu", facultyId, daysFromNow(14), "Innovation Center"],
      ["internship", "Summer Internship Opportunities at Zycus", "Zycus is hiring engineering interns for Summer 2026. Apply for roles in ML, Backend, and Frontend. Applications close in 10 days.", "faculty@campus.edu", facultyId, daysFromNow(10), "HR Block"],
      ["competition", "CodeChef Campus Challenge", "Monthly coding competition. Top 3 winners get certified scholarships and goodies. This month's theme: Dynamic Programming.", "faculty@campus.edu", facultyId, daysFromNow(21), "Online"],
      ["deadline", "Fee Payment Due Date", "Please clear your semester fees before the due date. Late payment will attract a penalty of ₹500 per week.", "faculty@campus.edu", facultyId, daysFromNow(5), "Admin Office"],
      ["announcement", "New Canteen Menu Launch", "The college canteen has launched a new menu with healthy options. Veg and non-veg both available at affordable prices.", "faculty@campus.edu", facultyId, null, "Canteen"],
      ["event", "Alumni Sharing Session", "Three pass-out alumni will share their journey from campus to industry. Session includes Q&A and networking. All years welcome.", "faculty@campus.edu", facultyId, daysFromNow(3), "Auditorium 2"],
    ];
    for (const [cat, title, body, email, posterId, date, loc] of notices) {
      await client.query("INSERT INTO notices (title, body, category, author_name, posted_by_id, event_date, location) VALUES ($1,$2,$3,$4,$5,$6,$7)", [title, body, cat, "Prof. Sharma", posterId, date, loc]);
    }

    // Lost & Found
    const lostFoundItems = [
      ["lost", "Student ID Card", "Found near the library entrance. My name is Rahul, CS 3rd year.", "id_card", "Library entrance", "open", userId],
      ["found", "Calculator (Casio FX-991)", "Found in Lab 3 during OS lab. Claim by describing the scratch on the back.", "electronics", "Lab 3", "open", facultyId],
      ["lost", "Keys with Blue Tag", "Lost keys with a blue robot keychain. Found near canteen?", "keys", "Canteen", "open", userId],
      ["found", "Linear Algebra Textbook", "Found on bench near admin block. Contains handwritten notes inside.", "book", "Admin Block", "open", facultyId],
      ["lost", "Headphones (Black)", "Lost SonyWH-CH711N headphones in Library 2nd floor.", "electronics", "Library 2nd Floor", "open", userId],
    ];
    for (const [type, title, desc, cat, loc, status, uid] of lostFoundItems) {
      await client.query("INSERT INTO lost_found (type, title, description, category, location, contact_email, status, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [type, title, desc, cat, loc, "demo@campus.edu", status, uid]);
    }

    // Projects
    const projects = [
      ["Build a Campus Event Discovery App", "We're building a React + Node app that aggregates all campus events into one calendar. Looking for a frontend dev familiar with React and someone who knows Next.js.", "React, Next.js, Node, JavaScript", userId, "Demo Student"],
      ["ML-Powered Food Waste Reduction", "Using ML to predict food waste in hostel mess and suggest portion adjustments. Need ML engineers and someone with Flask/FastAPI experience.", "Python, ML, Flask, pandas", facultyId, "Prof. Sharma"],
      ["Smart Attendance System using Face Recognition", "Real-time face recognition attendance system using OpenCV and face-api.js. Need backend and frontend developers.", "Python, OpenCV, React, face-api", userId, "Demo Student"],
      ["Multiplayer Trivia Game", "Building a real-time multiplayer trivia game using Socket.io. Looking for a UI/UX designer and a game logic developer.", "JavaScript, Socket.io, React, Node", facultyId, "Prof. Sharma"],
      ["Go - Campus Delivery Bot", "Autonomous delivery robot for campus packages. Need embedded systems and ROS developers.", "C++, ROS, Python, Arduino", userId, "Demo Student"],
    ];
    for (const [title, desc, skills, uid, author] of projects) {
      await client.query("INSERT INTO projects (title, description, skills, posted_by_id, author_name, status) VALUES ($1,$2,$3,$4,$5,'recruiting')", [title, desc, skills, uid, author]);
    }

    // Resources
    const resources = [
      ["DSA Cheat Sheet - All Sorting Algorithms", "Comprehensive cheat sheet covering bubble sort, quick sort, merge sort, and heap sort with complexity analysis and pseudocode.", "DSA", userId, "Demo Student"],
      ["DBMS Handwritten Notes - Normalization", "Step-by-step notes on 1NF, 2NF, 3NF, and BCNF with examples. Includes ER diagrams.", "DBMS", facultyId, "Prof. Sharma"],
      ["OS Process Scheduling Visual Guide", "Visual explanation of FCFS, SJF, Round Robin, and Priority Scheduling with numerical examples.", "OS", userId, "Demo Student"],
      ["CN - Subnetting Cheat Sheet", "Quick reference for subnetting, VLSM, and CIDR. Includes practice problems.", "CN", facultyId, "Prof. Sharma"],
      ["ML - Linear Algebra for ML", "Notes covering vectors, matrices, eigenvalues, and SVD with ML applications.", "ML", userId, "Demo Student"],
      ["Python Packaging Guide", "How to structure Python projects, use poetry/pip, and publish packages.", "Python", facultyId, "Prof. Sharma"],
    ];
    for (const [title, desc, subject, uid, author] of resources) {
      await client.query("INSERT INTO resources (title, description, subject, uploaded_by_id, author_name) VALUES ($1,$2,$3,$4,$5)", [title, desc, subject, uid, author]);
    }

    // Clubs
    const clubs = [
      ["CodeChef Campus Chapter", "We host monthly coding contests, workshops on competitive programming, and peer coding sessions. Open to all levels.", "tech", "Prof. Sharma", "faculty@campus.edu"],
      ["Robotics & AI Club", "Build robots, learn AI/ML, participate in national competitions. Weekly workshops on embedded systems and ML.", "tech", "Demo Student", "demo@campus.edu"],
      ["Photography Club", "Capture campus life! We do photo walks, star photography nights, and monthly exhibitions.", "arts", "Prof. Sharma", "faculty@campus.edu"],
      ["Debate & MUN Club", "Improve your public speaking, participate in MUNs, and host debate competitions on campus.", "arts", "Demo Student", "demo@campus.edu"],
      ["Green Campus Initiative", "Environmental awareness, tree plantation drives, and sustainability projects on campus.", "service", "Prof. Sharma", "faculty@campus.edu"],
      ["Music Club", "From acoustic to band sessions. Weekly jamming, annual concert, and individual music lessons.", "arts", "Demo Student", "demo@campus.edu"],
    ];
    for (const [name, desc, cat, leader, email] of clubs) {
      await client.query("INSERT INTO clubs (name, description, category, leader_name, contact_email) VALUES ($1,$2,$3,$4,$5)", [name, desc, cat, leader, email]);
    }

    await client.query("COMMIT");
    console.log("✅ Seed complete! Demo user: demo@campus.edu / demo1234");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", e);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
