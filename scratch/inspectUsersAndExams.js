const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const User = require('../server/models/User');
const Subject = require('../server/models/Subject');
const Chapter = require('../server/models/Chapter');
const Question = require('../server/models/Question');
const Exam = require('../server/models/Exam');
const Result = require('../server/models/Result');
const ExamSession = require('../server/models/ExamSession');

async function inspect() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('--- USERS ---');
  const users = await User.find().select('+password');
  console.log(users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role, isVerified: u.isVerified })));

  console.log('\n--- SUBJECTS ---');
  const subjects = await Subject.find();
  console.log(subjects.map(s => ({ id: s._id, name: s.name })));

  console.log('\n--- EXAMS ---');
  const exams = await Exam.find();
  console.log(exams.map(e => ({ id: e._id, title: e.title, subject: e.subject, subjectId: e.subjectId, isPublished: e.isPublished, questionCount: e.questionCount, totalMarks: e.totalMarks })));

  console.log('\n--- QUESTIONS ---');
  const questions = await Question.find();
  console.log(`Total questions in DB: ${questions.length}`);
  console.log(questions.map((q, idx) => ({ idx: idx + 1, id: q._id, subjectId: q.subjectId, subjectName: q.subjectName, chapterId: q.chapterId, examId: q.examId, text: q.questionText?.slice(0, 40), marks: q.marks })));

  console.log('\n--- RESULTS ---');
  const results = await Result.find();
  console.log(`Total results in DB: ${results.length}`);

  console.log('\n--- SESSIONS ---');
  const sessions = await ExamSession.find();
  console.log(`Total sessions in DB: ${sessions.length}`);

  await mongoose.connection.close();
}

inspect();
