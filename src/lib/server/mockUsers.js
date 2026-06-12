export const mockUsers = [
  {
    id: "usr_1",
    firstName: "Aysel",
    lastName: "Mammadova",
    name: "Aysel Mammadova",
    email: "aysel@example.com",
    role: "admin",
    roles: ["admin"],
    createdAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "usr_2",
    firstName: "Rashad",
    lastName: "Aliyev",
    name: "Rashad Aliyev",
    email: "rashad@example.com",
    role: "parent",
    roles: ["parent"],
    createdAt: "2026-06-02T09:00:00.000Z",
  },
  {
    id: "usr_3",
    firstName: "Leyla",
    lastName: "Hasanova",
    name: "Leyla Hasanova",
    email: "leyla@example.com",
    role: "child",
    roles: ["child"],
    createdAt: "2026-06-03T09:00:00.000Z",
  },
  {
    id: "usr_4",
    firstName: "Murad",
    lastName: "Karimli",
    name: "Murad Karimli",
    email: "murad@example.com",
    role: "parent",
    roles: ["parent"],
    createdAt: "2026-06-04T09:00:00.000Z",
  },
  {
    id: "usr_5",
    firstName: "Nigar",
    lastName: "Safarova",
    name: "Nigar Safarova",
    email: "nigar@example.com",
    role: "child",
    roles: ["child"],
    createdAt: "2026-06-05T09:00:00.000Z",
  },
];

export const paginateUsers = (page = 1, perPage = 10) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safePerPage = Math.min(Math.max(Number(perPage) || 10, 1), 50);
  const total = mockUsers.length;
  const totalPages = Math.max(Math.ceil(total / safePerPage), 1);
  const start = (safePage - 1) * safePerPage;

  return {
    data: mockUsers.slice(start, start + safePerPage),
    meta: {
      page: safePage,
      perPage: safePerPage,
      total,
      totalPages,
    },
  };
};

export const findMockUser = (id) => mockUsers.find((user) => user.id === id);

export const deleteMockUser = (id) => {
  const index = mockUsers.findIndex((user) => user.id === id);
  if (index === -1) return false;

  mockUsers.splice(index, 1);
  return true;
};
