export const mockSubjects = [
  { id: "sub_1", name: "Riyaziyyat", topicCount: 3, status: "active", createdAt: "2026-06-01T09:00:00.000Z" },
  { id: "sub_2", name: "İngilis dili", topicCount: 2, status: "active", createdAt: "2026-06-02T09:00:00.000Z" },
  { id: "sub_3", name: "Məntiq", topicCount: 1, status: "inactive", createdAt: "2026-06-03T09:00:00.000Z" },
];

export const mockTopics = {
  sub_1: [
    { id: "top_1", subjectId: "sub_1", name: "Faizlər", questionCount: 42, status: "active", createdAt: "2026-06-04T09:00:00.000Z" },
    { id: "top_2", subjectId: "sub_1", name: "Tənliklər", questionCount: 36, status: "active", createdAt: "2026-06-05T09:00:00.000Z" },
    { id: "top_3", subjectId: "sub_1", name: "Həndəsə", questionCount: 28, status: "inactive", createdAt: "2026-06-06T09:00:00.000Z" },
  ],
  sub_2: [
    { id: "top_4", subjectId: "sub_2", name: "Grammar", questionCount: 50, status: "active", createdAt: "2026-06-07T09:00:00.000Z" },
    { id: "top_5", subjectId: "sub_2", name: "Vocabulary", questionCount: 64, status: "active", createdAt: "2026-06-08T09:00:00.000Z" },
  ],
  sub_3: [
    { id: "top_6", subjectId: "sub_3", name: "Analogiyalar", questionCount: 22, status: "inactive", createdAt: "2026-06-09T09:00:00.000Z" },
  ],
};

const paginate = (items, page = 1, perPage = 10) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safePerPage = Math.min(Math.max(Number(perPage) || 10, 1), 50);
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / safePerPage), 1);
  const start = (safePage - 1) * safePerPage;

  return {
    data: items.slice(start, start + safePerPage),
    meta: { page: safePage, perPage: safePerPage, total, totalPages },
  };
};

const syncSubjectTopicCount = (subjectId) => {
  const subject = mockSubjects.find((item) => item.id === subjectId);
  if (subject) subject.topicCount = mockTopics[subjectId]?.length || 0;
};

export const paginateSubjects = (page, perPage) => paginate(mockSubjects, page, perPage);

export const createMockSubject = ({ name }) => {
  const subject = {
    id: `sub_${Date.now()}`,
    name,
    topicCount: 0,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  mockSubjects.unshift(subject);
  mockTopics[subject.id] = [];
  return subject;
};

export const findMockSubject = (id) => mockSubjects.find((subject) => subject.id === id);

export const deleteMockSubject = (id) => {
  const index = mockSubjects.findIndex((subject) => subject.id === id);
  if (index === -1) return false;

  mockSubjects.splice(index, 1);
  delete mockTopics[id];
  return true;
};

export const paginateTopics = (subjectId, page, perPage) =>
  paginate(mockTopics[subjectId] || [], page, perPage);

export const createMockTopic = (subjectId, { name }) => {
  if (!findMockSubject(subjectId)) return null;

  const topic = {
    id: `top_${Date.now()}`,
    subjectId,
    name,
    questionCount: 0,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  mockTopics[subjectId] = [topic, ...(mockTopics[subjectId] || [])];
  syncSubjectTopicCount(subjectId);
  return topic;
};

export const deleteMockTopic = (subjectId, topicId) => {
  const topics = mockTopics[subjectId] || [];
  const index = topics.findIndex((topic) => topic.id === topicId);
  if (index === -1) return false;

  topics.splice(index, 1);
  syncSubjectTopicCount(subjectId);
  return true;
};
