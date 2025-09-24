import { useState } from "react";


export default function Contact() {
    
    const setSubmit = ()=> alert('comment sent sucessfully')
   
  return (
    <section id="contact" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-yellow-900 mb-8">Contact Us</h2>

        <form className="max-w-lg mx-auto bg-white shadow-lg rounded-2xl p-8">
          <div className="mb-4">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              className="w-full px-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="mb-4">
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              className="w-full px-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="mb-4">
            <textarea
              name="message"
              placeholder="Your Message"
              rows="4"
              className="w-full px-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-yellow-500"
            ></textarea>
          </div>
          <button
            onClick={setSubmit}
            type="submit"
            className="w-full bg-yellow-900 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 transition"
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
}
