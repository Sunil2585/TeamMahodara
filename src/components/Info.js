import React, { useState } from "react";
import PageContainer from "../components/PageContainer";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { supabase } from "../supabaseClient";
import emailjs from "emailjs-com"; // npm install emailjs-com

// Fill these with your EmailJS credentials if you want to send email
const SERVICE_ID = "your_service_id";
const TEMPLATE_ID = "your_template_id";
const USER_ID = "your_user_id";

export default function AboutAndContact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);

    // Store in Supabase
    const { error } = await supabase.from("contact_messages").insert([form]);

    // Optionally send email using EmailJS
    let emailError = null;
    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          from_name: form.name,
          from_email: form.email,
          message: form.message,
        },
        USER_ID
      );
    } catch (err) {
      emailError = err;
    }

    setSending(false);

    if (!error && !emailError) {
      setSubmitted(true);
      setForm({ name: "", email: "", message: "" });
    } else if (error) {
      alert("Failed to save message. Please try again later.");
    } else if (emailError) {
      alert("Failed to send email. Please try again later.");
    }
  }

  return (
    <BackgroundWrapper>
      <PageContainer title="TEAM MAHODARA" userName="Samba">
        <div
          className="px-6 pb-8 flex flex-col gap-8"
          style={{
            background: "rgba(255, 248, 225, 0.85)",
            borderRadius: "1.5rem",
            boxShadow: "0 2px 12px 0 rgba(255,193,7,0.10)",
            padding: "2rem 1rem",
          }}
        >
          {/* About Section */}
          <section>
            <h2
              className="text-xl font-bold mb-2"
              style={{
                color: "#E65100",
                textShadow: "0 2px 8px #ffe0b2",
              }}
            >
              About Us
            </h2>
            <p
              className="mb-2"
              style={{
                color: "#6D4C00",
                fontWeight: 500,
              }}
            >
              Team Mahodara is a vibrant community dedicated to organizing and celebrating cultural, social, and spiritual events. Our mission is to bring people together, foster unity, and create memorable experiences for all participants.
            </p>
            <p
              className="mb-4"
              style={{
                color: "#6D4C00",
                fontWeight: 500,
              }}
            >
              We are grateful for the support of our sponsors, volunteers, and every member who contributes to our success. Explore our dashboard to see event details, contributions, expenses, and more!
            </p>
            {/* Map Location */}
            <div className="w-full flex justify-center mb-2">
              <iframe
                title="Team Mahodara Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3805.39337449386!2d78.45872947369196!3d17.488725499880758!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9100268b8939%3A0x29b6e6441a480c46!2sTEAM%20MAHODARA!5e0!3m2!1sen!2sin!4v1751609377156!5m2!1sen!2sin"
                height="220"
                style={{
                  border: 0,
                  borderRadius: "1rem",
                  boxShadow: "0 2px 8px #ffe0b2",
                  width: "100%",
                  minHeight: "220px",
                }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </section>

          {/* Contact Section */}
          <section>
            <h2
              className="text-xl font-bold mb-2"
              style={{
                color: "#E65100",
                textShadow: "0 2px 8px #ffe0b2",
              }}
            >
              Contact Us
            </h2>
            <div
              className="rounded-lg p-4 shadow mb-4"
              style={{
                background: "rgba(255, 253, 231, 0.85)",
              }}
            >
              <div className="mb-2">
                <span className="font-semibold" style={{ color: "#E65100" }}>Email:</span>{" "}
                <a href="mailto:teammahodara@gmail.com" style={{ color: "#6D4C00", textDecoration: "underline" }}>
                  teammahodara@gmail.com
                </a>
              </div>
              <div className="mb-2">
                <span className="font-semibold" style={{ color: "#E65100" }}>Phone:</span>{" "}
                <a href="tel:+918919135987" style={{ color: "#6D4C00", textDecoration: "underline" }}>
                  +91 89191 35987
                </a>
              </div>
              <div>
                <span className="font-semibold" style={{ color: "#E65100" }}>Address:</span>{" "}
                <span style={{ color: "#6D4C00" }}>
                  TEAM MAHODARA<br/>
                  49-244/5, Balreddy Nagar, Quthbullapur,<br/>
                  Hyderabad, Telangana 500054
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: "#E65100" }}>Or send us a message:</h3>
              {submitted ? (
                <div className="text-green-700 font-semibold">Thank you for contacting us!</div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                  <textarea
                    name="message"
                    placeholder="Your Message"
                    className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={3}
                  />
                  <button
                    type="submit"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg transition"
                    disabled={sending}
                  >
                    {sending ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </PageContainer>
    </BackgroundWrapper>
  );
}
