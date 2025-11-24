import { useState } from "react";
import axios from "axios";

export default function ApplicantRegistrationForm() {
  const [form, setForm] = useState({
    surname: "",
    firstname: "",
    otherName: "",
    phone: "",
    email: "",
    applicationType: "",
    programId: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api.createApplicant(form);

      setMessage(
        "Registration successful! A continuation link has been sent to your email."
      );

      setForm({
        surname: "",
        firstname: "",
        otherName: "",
        phone: "",
        email: "",
        applicationType: "",
        programId: "",
        intakeSessionId: currentSession?.id || "",
      });
    } catch (err) {
      setMessage("Error: " + (err.response?.data || "Something went wrong"));
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow-lg p-6 rounded-xl mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Applicant Registration
      </h2>

      {message && (
        <p className="mb-4 text-center text-sm text-blue-600 font-medium">
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Surname */}
        <div>
          <label className="block font-medium mb-1">Surname</label>
          <input
            type="text"
            name="surname"
            value={form.surname}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Firstname */}
        <div>
          <label className="block font-medium mb-1">Firstname</label>
          <input
            type="text"
            name="firstname"
            value={form.firstname}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Other Name */}
        <div>
          <label className="block font-medium mb-1">Other Name</label>
          <input
            type="text"
            name="otherName"
            value={form.otherName}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block font-medium mb-1">Phone Number</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Application Type */}
        <div>
          <label className="block font-medium mb-1">Application Type</label>
          <select
            name="applicationType"
            value={form.applicationType}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Select Type</option>
            <option value="NCE">NCE</option>
            <option value="PRE-NCE">PRE-NCE</option>
          </select>
        </div>

        {/* Program Choice */}
        <div>
          <label className="block font-medium mb-1">Program Choice</label>
          <select
            name="programId"
            value={form.programId}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Select Program</option>
            {/* You will fill with API later */}
            <option value="1">Computer Science</option>
            <option value="2">Business Education</option>
            <option value="3">Mathematics</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
