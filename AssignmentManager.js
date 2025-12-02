// ======================================================
// Assignment Class
// ======================================================

class Assignment {
  constructor(assignmentName) {
    this.assignmentName = assignmentName;
    this.status = "released";   // initial status when created
    this._grade = null;         // "private" by convention
  }

  setGrade(grade) {
    this._grade = grade;

    // status must contain 'pass' or 'fail'
    if (grade > 50) {
      this.status = "pass";
    } else {
      this.status = "fail";
    }
  }

  // helper so Student can compute averages
  getGradeValue() {
    return this._grade;
  }
}



// ======================================================
// Student Class
// ======================================================

class Student {
  constructor(fullName, email, observer) {
    this.fullName = fullName;
    this.email = email;
    this.assignmentStatuses = []; // array of Assignment objects
    this.overallGrade = 0;

    this._observer = observer;       // Observer pattern
    this._workingTimers = new Map(); // for async startWorking timers
  }

  // ----- required setters -----
  setFullName(name) {
    this.fullName = name;
  }

  setEmail(email) {
    this.email = email;
  }

  // ----- helper methods -----
  _findAssignment(name) {
    return this.assignmentStatuses.find(
      (a) => a.assignmentName === name
    );
  }

  _ensureAssignment(name) {
    let assignment = this._findAssignment(name);
    if (!assignment) {
      assignment = new Assignment(name);
      this.assignmentStatuses.push(assignment);
      this._notify(assignment); // "released"
    }
    return assignment;
  }

  _notify(assignment) {
    if (this._observer) {
      this._observer.notify(
        this,
        assignment.assignmentName,
        assignment.status
      );
    }
  }

  _updateOverallGrade() {
    this.overallGrade = this.getGrade();
  }

  // ----- required methods -----

  // If assignment doesn’t exist, create it with status "released".
  // If grade is provided, setGrade and notify.
  updateAssignmentStatus(name, grade) {
    const assignment = this._ensureAssignment(name);

    if (typeof grade === "number") {
      assignment.setGrade(grade);
      this._updateOverallGrade();
      this._notify(assignment);
    }

    return assignment;
  }

  // Return "Pass", "Fail", or "Hasn't been assigned"
  getAssignmentStatus(name) {
    const assignment = this._findAssignment(name);
    if (!assignment) {
      return "Hasn't been assigned";
    }

    const st = assignment.status.toLowerCase();

    if (st.includes("pass")) return "Pass";
    if (st.includes("fail")) return "Fail";

    // for statuses like "released", "working", "submitted", etc.
    return assignment.status;
  }

  // Average grade over all graded assignments
  getGrade() {
    const graded = this.assignmentStatuses
      .map((a) => a.getGradeValue())
      .filter((g) => typeof g === "number");

    if (graded.length === 0) return 0;

    const sum = graded.reduce((acc, g) => acc + g, 0);
    return sum / graded.length;
  }

  // Set status to "working" and after 500ms submit (unless reminder submits earlier).
  startWorking(assignmentName) {
    const assignment = this._ensureAssignment(assignmentName);

    assignment.status = "working";
    this._notify(assignment);

    // cancel previous timer if exists
    if (this._workingTimers.has(assignmentName)) {
      clearTimeout(this._workingTimers.get(assignmentName));
    }

    const timerId = setTimeout(() => {
      this.submitAssignment(assignmentName);
    }, 500);

    this._workingTimers.set(assignmentName, timerId);
  }

  // Submit assignment, then after 500ms assign random grade 0–100.
  submitAssignment(assignmentName) {
    const assignment = this._ensureAssignment(assignmentName);

    // If already submitted or graded, do nothing.
    if (
      assignment.status === "submitted" ||
      assignment.status === "pass" ||
      assignment.status === "fail"
    ) {
      return;
    }

    // cancel any working timer
    if (this._workingTimers.has(assignmentName)) {
      clearTimeout(this._workingTimers.get(assignmentName));
      this._workingTimers.delete(assignmentName);
    }

    assignment.status = "submitted";
    this._notify(assignment);

    // simulate grading after 500ms
    setTimeout(() => {
      const randomGrade = Math.floor(Math.random() * 101); // 0–100
      assignment.setGrade(randomGrade);
      this._updateOverallGrade();
      this._notify(assignment);
    }, 500);
  }

  // Called when ClassList sends a reminder.
  // Status becomes "final reminder" and the assignment is submitted.
  receiveReminder(assignmentName) {
    const assignment = this._ensureAssignment(assignmentName);

    assignment.status = "final reminder";
    this._notify(assignment);

    this.submitAssignment(assignmentName);
  }

  // For ClassList: check if assignment has been graded (pass/fail).
  isAssignmentComplete(name) {
    const assignment = this._findAssignment(name);
    if (!assignment) return false;
    return assignment.status === "pass" || assignment.status === "fail";
  }

  // For ClassList: has the student at least submitted this assignment?
  hasSubmittedAssignment(name) {
    const assignment = this._findAssignment(name);
    if (!assignment) return false;

    const st = assignment.status;
    return st === "submitted" || st === "pass" || st === "fail";
  }
}



// ======================================================
// Observer Class
// ======================================================

class Observer {
  notify(student, assignmentName, status) {
    let message;

    switch (status) {
      case "released":
        message = `${student.fullName}, ${assignmentName} has been released.`;
        break;
      case "working":
        message = `${student.fullName} is working on ${assignmentName}.`;
        break;
      case "submitted":
        message = `${student.fullName} has submitted ${assignmentName}.`;
        break;
      case "final reminder":
        message = `${student.fullName}, final reminder for ${assignmentName}.`;
        break;
      case "pass":
        message = `${student.fullName} has passed ${assignmentName}`;
        break;
      case "fail":
        message = `${student.fullName} has failed ${assignmentName}`;
        break;
      default:
        message = `${student.fullName}, ${assignmentName} is now ${status}.`;
    }

    console.log(`Observer → ${message}`);
  }
}



// ======================================================
// ClassList (array of students)
// ======================================================

class ClassList {
  constructor(observer) {
    this.students = [];
    this._observer = observer;
  }

  // addStudent: print added notification
  addStudent(student) {
    this.students.push(student);
    console.log(`${student.fullName} has been added to the classlist.`);
  }

  // removeStudent: by object or by name
  removeStudent(studentOrName) {
    const name =
      typeof studentOrName === "string"
        ? studentOrName
        : studentOrName.fullName;

    this.students = this.students.filter((s) => s.fullName !== name);
  }

  // findStudentByName: exact full name match
  findStudentByName(fullName) {
    return this.students.find((s) => s.fullName === fullName) || null;
  }

  // If assignmentName is given: students who haven’t submitted/graded that assignment.
  // If not: students who have any assignment still in a non-final state.
  findOutstandingAssignments(assignmentName) {
    const result = [];

    if (assignmentName) {
      this.students.forEach((student) => {
        const assignment = student._findAssignment(assignmentName);

        if (!assignment) {
          result.push(student.fullName);
        } else if (
          assignment.status !== "submitted" &&
          assignment.status !== "pass" &&
          assignment.status !== "fail"
        ) {
          result.push(student.fullName);
        }
      });
    } else {
      this.students.forEach((student) => {
        const hasOutstanding = student.assignmentStatuses.some((a) =>
          ["released", "working", "final reminder"].includes(a.status)
        );
        if (hasOutstanding) {
          result.push(student.fullName);
        }
      });
    }

    return result;
  }

  // Release each assignment to all students in parallel.
  releaseAssignmentsParallel(assignmentNames) {
    const promises = assignmentNames.map((name) => {
      return Promise.resolve().then(() => {
        this.students.forEach((student) => {
          student.updateAssignmentStatus(name);
        });
      });
    });

    return Promise.all(promises);
  }

  // Send reminder for a specific assignment.
  // Students who haven’t completed it get a final reminder and auto-submission.
  sendReminder(assignmentName) {
    this.students.forEach((student) => {
      if (!student.isAssignmentComplete(assignmentName)) {
        student.receiveReminder(assignmentName);
      }
    });
  }
}

// ===== TEMP TEST (REMOVE BEFORE SUBMITTING) =====

const observer = new Observer();
const classList = new ClassList(observer);

const s1 = new Student("Alice Smith", "alice@example.com", observer);
const s2 = new Student("Bob Jones", "bob@example.com", observer);

classList.addStudent(s1);
classList.addStudent(s2);

classList.releaseAssignmentsParallel(["A1", "A2"]).then(() => {
  s1.startWorking("A1");
  s2.startWorking("A2");

  setTimeout(() => {
    classList.sendReminder("A1");
  }, 200);
});


