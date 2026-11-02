export const MENTORSHIP_API =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const getMentorshipConfig = () => ({
  headers: {
    Authorization: `Bearer ${
      localStorage.getItem("token") || localStorage.getItem("userJwtToken") || ""
    }`,
  },
});

export const getRequestError = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

export const formatSessionDate = (date) => {
  if (!date) return "Date not set";
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getSessionTopics = (topics) =>
  Array.isArray(topics) ? topics : [];

export const sessionDomains = [
  "Java Development",
  "MERN Stack",
  "Web Development",
  "Python",
  "Data Science",
  "AI/ML",
  "Cloud Computing",
  "Cybersecurity",
  "Electronics",
  "Product Management",
  "Career Guidance",
  "Other",
];
