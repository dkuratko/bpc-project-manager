'use strict';

/**
 * CONTACTS — docs/15. A customer is a company, a contact is a person.
 *
 * Two levels, one list, which is exactly the project browser's shape. This
 * module hands the screen rows; the grouping vocabulary is docs/14's and is
 * not re-decided here.
 *
 * Two counts that look like they should agree and must not:
 *
 *   a PERSON's count   how many projects they are on.
 *   a COMPANY's count  how many DISTINCT projects the company is on.
 *
 * Grant and Ashley are on the same two jobs, so Exerplay is on 2 while its
 * people sum to 4. docs/15 says in as many words: do not "fix" this.
 */

/** The marker means an automatic rule TOUCHES this row — docs/15. */
function autoRules(db) {
  const rows = db.prepare(`
    SELECT d.scope_kind, d.customer_id, d.contact_id, d.add_contact_id, d.role,
           trigger_person.name AS trigger_name,
           cu.name             AS trigger_company,
           added.name          AS added_name
      FROM contact_defaults d
      LEFT JOIN contacts  trigger_person ON trigger_person.id = d.contact_id
      LEFT JOIN customers cu             ON cu.id = d.customer_id
      LEFT JOIN contacts  added          ON added.id = d.add_contact_id`).all();

  // One rule, one marker. A person rule marks the person who gets pulled in;
  // a company rule marks the company, because its trigger is not a person.
  // Marking both ends would put two cc's on one rule and make the column
  // mean something different on each row.
  const onContact = new Map();
  const onCustomer = new Map();
  for (const r of rows) {
    if (r.scope_kind === 'contact') {
      onContact.set(r.add_contact_id,
        `${r.role} — wherever ${r.trigger_name} goes`);
    } else {
      onCustomer.set(r.customer_id,
        `${r.role} — on every ${r.trigger_company} project`);
    }
  }
  return { onContact, onCustomer };
}

function contactList(db, { showInactive = false } = {}) {
  const rule = autoRules(db);
  const live = showInactive ? '' : 'WHERE active = 1';

  const companies = db.prepare(`
    SELECT id, name, kind, notes, active,
           (SELECT COUNT(DISTINCT p.id) FROM projects p
             WHERE p.customer_id = customers.id) AS projects
      FROM customers ${live} ORDER BY name`).all();

  const people = db.prepare(`
    SELECT id, customer_id, name, title, phone, email, notes, active,
           (SELECT COUNT(DISTINCT pc.project_id) FROM project_contacts pc
             WHERE pc.contact_id = contacts.id) AS projects
      FROM contacts ${live} ORDER BY name`).all();

  const byCustomer = new Map(companies.map((c) => [c.id, []]));
  for (const p of people) byCustomer.get(p.customer_id)?.push({
    ...p,
    active: !!p.active,
    auto: rule.onContact.get(p.id) ?? null,
    // Anything a job references never dies. Delete exists only where nothing
    // points at the row — everything else deactivates. docs/14.
    deletable: p.projects === 0,
  });

  return {
    customers: companies.map((c) => ({
      ...c,
      active: !!c.active,
      auto: rule.onCustomer.get(c.id) ?? null,
      deletable: c.projects === 0 && (byCustomer.get(c.id) ?? []).length === 0,
      people: byCustomer.get(c.id) ?? [],
    })),
    counts: { customers: companies.length, people: people.length },
  };
}

/**
 * Deactivate, not delete: the person leaves every picker in the app and stays
 * on the projects they were on. Reversible, which is why the screen offers the
 * way back rather than stranding the row behind `☑ Show inactive`.
 */
function setActive(db, { kind, id, active }) {
  const table = kind === 'customer' ? 'customers' : 'contacts';
  db.prepare(`UPDATE ${table} SET active = ? WHERE id = ?`).run(active ? 1 : 0, id);
  return { ok: true };
}

module.exports = { contactList, setActive, autoRules };
