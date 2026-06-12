export const mockNotifications = Array.from({ length: 23 }, (_, index) => {
  const id = index + 1;

  return {
    id: `mock-notification-${id}`,
    title: id % 3 === 0 ? "Yeni imtahan təyin edildi" : "Yeni bildiriş",
    message:
      id % 3 === 0
        ? "Sizin üçün yeni imtahan yaradıldı. Detallara baxın."
        : "Platformada yeni yeniləmə mövcuddur.",
    isRead: id > 7,
    createdAt: new Date(Date.now() - id * 60 * 60 * 1000).toISOString(),
  };
});

export const getMockNotifications = ({ unreadOnly = false } = {}) => {
  const items = unreadOnly
    ? mockNotifications.filter((item) => !item.isRead)
    : mockNotifications;

  return [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const markMockNotificationsRead = (ids = []) => {
  const idSet = new Set(ids);

  mockNotifications.forEach((item) => {
    if (idSet.has(item.id)) {
      item.isRead = true;
    }
  });

  return {
    updatedCount: mockNotifications.filter((item) => idSet.has(item.id)).length,
    unreadCount: mockNotifications.filter((item) => !item.isRead).length,
  };
};

export const paginate = (items, page = 1, perPage = 10) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safePerPage = Math.min(Math.max(Number(perPage) || 10, 1), 50);
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / safePerPage), 1);
  const start = (safePage - 1) * safePerPage;

  return {
    data: items.slice(start, start + safePerPage),
    meta: {
      page: safePage,
      perPage: safePerPage,
      total,
      totalPages,
      unreadCount: items.filter((item) => !item.isRead).length,
    },
  };
};
