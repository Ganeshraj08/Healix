import { FaPhone, FaGlobe, FaBook } from 'react-icons/fa';

function Resources() {
  const emergencyContacts = [
    {
      name: "National Crisis Hotline",
      phone: "1800-891-4416",
      available: "24/7",
    },
    {
      name: "Crisis Text Line",
      phone: "Text HOME to 741741",
      available: "24/7",
    },
  ];

  const resources = [
    {
      title: "Meditation Basics",
      description: "Learn the fundamentals of meditation practice.",
      link: "#",
    },
    {
      title: "Stress Management Guide",
      description: "Comprehensive guide to managing daily stress.",
      link: "#",
    },
    {
      title: "Sleep Hygiene Tips",
      description: "Improve your sleep quality with these evidence-based tips.",
      link: "#",
    },
  ];

  return (
    <div className="space-y-6 mt-7">
      <h1 className="text-3xl font-bold">Resources</h1>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FaPhone className="mr-2" />
          Emergency Contacts
        </h2>
        <div className="space-y-4">
          {emergencyContacts.map((contact) => (
            <div key={contact.name} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold">{contact.name}</h3>
              <p className="text-primary-600">{contact.phone}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available: {contact.available}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FaBook className="mr-2" />
          Educational Resources
        </h2>
        <div className="grid gap-4">
          {resources.map((resource) => (
            <a
              key={resource.title}
              href={resource.link}
              className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <h3 className="font-semibold">{resource.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{resource.description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Resources;