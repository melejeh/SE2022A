let allCourses = [];
let currentCourses = [];
let selectedCourse = null;

class Course {
  constructor(data, index) {
    this.id = data.id ?? `course-${index}`;
    this.title = data.title ?? "Untitled";
    this.department = data.department ?? "Unknown";
    this.level = data.level ?? "";
    this.credits = data.credits ?? "";
    this.instructor = data.instructor ?? "TBA";
    this.description = data.description ?? "";
    this.semester = data.semester ?? "";
  }
}

const fileInput = document.getElementById("file-input");
const errorMessageBox = document.getElementById("error-message");

const deptFilter = document.getElementById("department-filter");
const levelFilter = document.getElementById("level-filter");
const creditsFilter = document.getElementById("credits-filter");
const instructorFilter = document.getElementById("instructor-filter");
const sortSelect = document.getElementById("sort-select");

const courseListEl = document.getElementById("course-list");
const courseDetailsEl = document.getElementById("course-details");

fileInput.addEventListener("change", handleFileSelected);
deptFilter.addEventListener("change", applyFiltersAndSort);
levelFilter.addEventListener("change", applyFiltersAndSort);
creditsFilter.addEventListener("change", applyFiltersAndSort);
instructorFilter.addEventListener("change", applyFiltersAndSort);
sortSelect.addEventListener("change", applyFiltersAndSort);

function handleFileSelected() {
  clearMessage();

  const file = fileInput.files[0];
  if (!file) {
    showError("Please choose a JSON file.");
    return;
  }

  const reader = new FileReader();

  reader.onload = e => {
    try {
      const text = e.target.result;
      const rawData = JSON.parse(text);

      if (!Array.isArray(rawData)) {
        showError("JSON file must contain an array of course objects.");
        allCourses = [];
        currentCourses = [];
        renderCourseList([]);
        renderCourseDetails(null);
        return;
      }

      allCourses = rawData.map((obj, index) => new Course(obj, index));
      currentCourses = allCourses;

      populateFilterOptions(allCourses);
      applyFiltersAndSort();
      renderCourseDetails(null);
      showInfo("Loaded " + allCourses.length + " courses.");

    } catch (err) {
      showError("Invalid JSON file format.");
      allCourses = [];
      currentCourses = [];
      renderCourseList([]);
      renderCourseDetails(null);
    }
  };

  reader.onerror = () => {
    showError("Error reading file.");
  };

  reader.readAsText(file);
}

function applyFiltersAndSort() {
  if (allCourses.length === 0) {
    renderCourseList([]);
    return;
  }

  const d = deptFilter.value;
  const l = levelFilter.value;
  const c = creditsFilter.value;
  const i = instructorFilter.value;
  const s = sortSelect.value;

  let result = allCourses.filter(course => {
    const okDept = !d || course.department === d;
    const okLevel = !l || String(course.level) === l;
    const okCredits = !c || String(course.credits) === c;
    const okInstructor = !i || course.instructor === i;
    return okDept && okLevel && okCredits && okInstructor;
  });

  result = sortCourses(result, s);
  currentCourses = result;
  renderCourseList(currentCourses);

  if (selectedCourse && !currentCourses.includes(selectedCourse)) {
    renderCourseDetails(null);
  }
}

function sortCourses(courses, sortKey) {
  const sorted = [...courses];

  switch (sortKey) {
    case "id-asc":
      sorted.sort((a, b) => compareStrings(a.id, b.id));
      break;
    case "id-desc":
      sorted.sort((a, b) => compareStrings(b.id, a.id));
      break;
    case "title-asc":
      sorted.sort((a, b) => compareStrings(a.title, b.title));
      break;
    case "title-desc":
      sorted.sort((a, b) => compareStrings(b.title, a.title));
      break;
    case "sem-earliest":
      sorted.sort((a, b) => compareSemesterAsc(a.semester, b.semester));
      break;
    case "sem-latest":
      sorted.sort((a, b) => compareSemesterDesc(a.semester, b.semester));
      break;
    case "none":
    default:
      break;
  }

  return sorted;
}

function compareStrings(a, b) {
  const sa = String(a ?? "").toLowerCase();
  const sb = String(b ?? "").toLowerCase();
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

function normalizeSemester(sem) {
  if (!sem || typeof sem !== "string") return null;
  const parts = sem.trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const season = parts[0];
  const year = Number(parts[1]);
  const order = { Winter: 0, Spring: 1, Summer: 2, Fall: 3 };
  const seasonIndex = order[season];
  if (!Number.isFinite(year) || seasonIndex === undefined) return null;
  return { year, seasonIndex };
}

function compareSemesterAsc(aSem, bSem) {
  const a = normalizeSemester(aSem);
  const b = normalizeSemester(bSem);
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  if (a.year !== b.year) return a.year - b.year;
  return a.seasonIndex - b.seasonIndex;
}

function compareSemesterDesc(aSem, bSem) {
  return -compareSemesterAsc(aSem, bSem);
}

function populateFilterOptions(courses) {
  const deptSet = new Set();
  const levelSet = new Set();
  const creditsSet = new Set();
  const instructorSet = new Set();

  courses.forEach(c => {
    if (c.department) deptSet.add(c.department);
    if (c.level !== "" && c.level !== null && c.level !== undefined) {
      levelSet.add(String(c.level));
    }
    if (c.credits !== "" && c.credits !== null && c.credits !== undefined) {
      creditsSet.add(String(c.credits));
    }
    if (c.instructor && c.instructor !== "TBA") {
      instructorSet.add(c.instructor);
    }
  });

  fillSelect(deptFilter, deptSet);
  fillSelect(levelFilter, levelSet);
  fillSelect(creditsFilter, creditsSet);
  fillSelect(instructorFilter, instructorSet);
}

function fillSelect(selectEl, values) {
  selectEl.innerHTML = "";

  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "All";
  selectEl.appendChild(allOpt);

  Array.from(values).sort((a, b) => compareStrings(a, b)).forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  });
}

function renderCourseList(courses) {
  courseListEl.innerHTML = "";

  if (!courses || courses.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No courses to display.";
    courseListEl.appendChild(li);
    return;
  }

  courses.forEach(course => {
    const li = document.createElement("li");
    li.textContent = course.id;
    li.style.cursor = "pointer";

    li.addEventListener("click", () => {
      selectedCourse = course;
      renderCourseDetails(course);
    });

    courseListEl.appendChild(li);
  });
}

function renderCourseDetails(course) {
  courseDetailsEl.innerHTML = "";

  if (!course) {
    courseDetailsEl.innerHTML = "<p>Select a course to view details.</p>";
    return;
  }

  courseDetailsEl.innerHTML = `
    <h2>${course.id}</h2>
    <p><strong>Title:</strong> ${course.title}</p>
    <p><strong>Department:</strong> ${course.department}</p>
    <p><strong>Level:</strong> ${course.level}</p>
    <p><strong>Credits:</strong> ${course.credits}</p>
    <p><strong>Instructor:</strong> ${course.instructor}</p>
    <p><strong>Semester:</strong> ${course.semester}</p>
    <p>${course.description}</p>
  `;
}

function showError(message) {
  errorMessageBox.style.color = "red";
  errorMessageBox.textContent = message;
}

function showInfo(message) {
  errorMessageBox.style.color = "green";
  errorMessageBox.textContent = message;
}

function clearMessage() {
  errorMessageBox.textContent = "";
}
