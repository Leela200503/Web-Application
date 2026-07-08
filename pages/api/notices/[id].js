import prisma from '../../../lib/prisma';

const allowedCategories = ['Exam', 'Event', 'General'];
const allowedPriorities = ['Normal', 'Urgent'];

function validateNoticePayload(body) {
  if (!body || typeof body !== 'object') {
    return 'Request body must be a JSON object.';
  }

  const { title, body: bodyText, category, priority, publishDate, image } = body;

  if (typeof title !== 'string' || title.trim() === '') {
    return 'Title is required.';
  }

  if (typeof bodyText !== 'string' || bodyText.trim() === '') {
    return 'Body is required.';
  }

  if (!allowedCategories.includes(category)) {
    return 'Category is invalid.';
  }

  if (!allowedPriorities.includes(priority)) {
    return 'Priority is invalid.';
  }

  const parsedDate = new Date(publishDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Publish date must be valid.';
  }

  if (typeof image === 'string' && image.trim() !== '' && !/^https?:\/\//i.test(image.trim())) {
    return 'Image must be a valid URL.';
  }

  return null;
}

export default async function handler(req, res) {
  const noticeId = Number(req.query.id);
  if (!Number.isInteger(noticeId)) {
    return res.status(400).json({ error: 'Invalid notice ID.' });
  }

  if (req.method === 'GET') {
    try {
      const notice = await prisma.notice.findUnique({ where: { id: noticeId } });
      if (!notice) {
        return res.status(404).json({ error: 'Notice not found.' });
      }
      return res.status(200).json({ notice });
    } catch (error) {
      return res.status(500).json({ error: 'Unable to fetch notice.' });
    }
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const validationError = validateNoticePayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    try {
      const notice = await prisma.notice.update({
        where: { id: noticeId },
        data: {
          title: req.body.title.trim(),
          body: req.body.body.trim(),
          category: req.body.category,
          priority: req.body.priority,
          publishDate: new Date(req.body.publishDate),
          image: req.body.image?.trim() || null,
        },
      });
      return res.status(200).json({ notice });
    } catch (error) {
      return res.status(404).json({ error: 'Notice not found.' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.notice.delete({ where: { id: noticeId } });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(404).json({ error: 'Notice not found.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
