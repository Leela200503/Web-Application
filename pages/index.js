import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

const categories = ['Exam', 'Event', 'General'];
const priorities = ['Normal', 'Urgent'];

const emptyForm = {
  title: '',
  body: '',
  category: 'General',
  priority: 'Normal',
  publishDate: '',
  image: '',
};

export default function HomePage() {
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const refreshNotices = async () => {
    const response = await fetch('/api/notices');
    const data = await response.json();
    setNotices(data.notices || []);
    setLoading(false);
  };

  useEffect(() => {
    refreshNotices();
  }, []);

  useEffect(() => {
    const id = router.query.id;
    if (!id) {
      setForm(emptyForm);
      setEditingId(null);
      return;
    }

    const selected = notices.find((notice) => String(notice.id) === String(id));
    if (selected) {
      setEditingId(selected.id);
      setForm({
        title: selected.title,
        body: selected.body,
        category: selected.category,
        priority: selected.priority,
        publishDate: new Date(selected.publishDate).toISOString().split('T')[0],
        image: selected.image || '',
      });
    }
  }, [router.query.id, notices]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('Saving notice…');

    const payload = {
      ...form,
      publishDate: form.publishDate,
    };

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/notices/${editingId}` : '/api/notices';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error || 'Unable to save notice.');
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    setStatus(editingId ? 'Notice updated.' : 'Notice created.');
    router.replace('/', undefined, { shallow: true });
    refreshNotices();
  };

  const handleEdit = (notice) => {
    router.push(`/?id=${notice.id}`, undefined, { shallow: true });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this notice?');
    if (!confirmed) return;

    const response = await fetch(`/api/notices/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error || 'Unable to delete notice.');
      return;
    }

    setStatus('Notice deleted.');
    if (editingId === id) {
      setForm(emptyForm);
      setEditingId(null);
      router.replace('/', undefined, { shallow: true });
    }
    refreshNotices();
  };

  const heading = useMemo(() => (editingId ? 'Edit Notice' : 'Add Notice'), [editingId]);

  return (
    <div className="page-shell">
      <header className="hero-card">
        <div>
          <p className="eyebrow">Reno Platforms</p>
          <h1>Notice Board</h1>
          <p className="hero-copy">Post updates, events, and academic notices with urgency-aware ordering.</p>
        </div>
        <a className="ghost-link" href="https://reno-platforms.com" target="_blank" rel="noreferrer">Visit Reno</a>
      </header>

      <main className="layout-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>{heading}</h2>
            {editingId ? <button className="secondary-btn" onClick={() => { setEditingId(null); setForm(emptyForm); router.replace('/', undefined, { shallow: true }); }}>Cancel</button> : null}
          </div>

          <form onSubmit={handleSubmit} className="notice-form">
            <label>
              Title
              <input name="title" value={form.title} onChange={handleChange} required />
            </label>

            <label>
              Body
              <textarea name="body" value={form.body} onChange={handleChange} rows={5} required />
            </label>

            <div className="row-fields">
              <label>
                Category
                <select name="category" value={form.category} onChange={handleChange}>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label>
                Priority
                <select name="priority" value={form.priority} onChange={handleChange}>
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="row-fields">
              <label>
                Publish Date
                <input name="publishDate" type="date" value={form.publishDate} onChange={handleChange} required />
              </label>

              <label>
                Image URL (optional)
                <input name="image" value={form.image} onChange={handleChange} placeholder="https://..." />
              </label>
            </div>

            <button className="primary-btn" type="submit">{editingId ? 'Save Changes' : 'Create Notice'}</button>
          </form>

          {status ? <p className="status-text">{status}</p> : null}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>All Notices</h2>
            <span className="count-pill">{notices.length} total</span>
          </div>

          {loading ? (
            <p>Loading notices…</p>
          ) : notices.length === 0 ? (
            <p className="empty-state">No notices yet. Create the first one to get started.</p>
          ) : (
            <div className="notice-grid">
              {notices.map((notice) => (
                <article key={notice.id} className="notice-card">
                  <div className="card-top">
                    <span className={`badge ${notice.priority === 'Urgent' ? 'urgent' : 'normal'}`}>{notice.priority}</span>
                    <span className="category-pill">{notice.category}</span>
                  </div>
                  <h3>{notice.title}</h3>
                  <p>{notice.body}</p>
                  <div className="meta-row">
                    <span>{new Date(notice.publishDate).toLocaleDateString()}</span>
                  </div>
                  {notice.image ? <img src={notice.image} alt={notice.title} className="notice-image" /> : null}
                  <div className="card-actions">
                    <button className="secondary-btn" onClick={() => handleEdit(notice)}>Edit</button>
                    <button className="danger-btn" onClick={() => handleDelete(notice.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
