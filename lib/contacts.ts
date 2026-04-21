/**
 * Web Contacts API wrapper with graceful fallback
 */

export interface ContactEntry {
  name: string;
  phone?: string;
}

export async function isContactsAPISupported(): Promise<boolean> {
  return (
    'contacts' in navigator &&
    'ContactsManager' in window
  );
}

export async function requestContacts(): Promise<ContactEntry[]> {
  if (!(await isContactsAPISupported())) {
    throw new Error('Contacts API not supported on this device/browser');
  }

  const props = ['name', 'tel'];
  const opts = { multiple: true };

  try {
    // @ts-ignore – Web Contacts API types not in standard TS lib
    const contacts = await navigator.contacts.select(props, opts);
    return contacts.map((c: any) => ({
      name: Array.isArray(c.name) ? c.name[0] : c.name,
      phone: Array.isArray(c.tel) ? c.tel[0] : c.tel,
    }));
  } catch (err) {
    throw new Error(`Failed to access contacts: ${(err as Error).message}`);
  }
}
