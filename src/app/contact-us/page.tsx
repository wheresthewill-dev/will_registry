import PublicLayout from "@/components/public-layout";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

export default function ContactUsPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Mail className="h-16 w-16 text-blue-600 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Contact Us
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions about securing your Will's location? Our friendly
              support team is here to help you every step of the way.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {/* Email */}
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Email</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Get detailed support via email
                </p>
                <a
                  href="mailto:support@wheresthewill.com"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  support@wheresthewill.com
                </a>
              </div>

              {/* Phone */}
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Phone</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Speak with our team directly
                </p>
                <a
                  href="tel:1-800-945-5562"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  1-800-WILL-LOC
                </a>
              </div>

              {/* Address */}
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Address</h3>
                <p className="text-gray-600 text-sm">
                  123 Legacy Lane
                  <br />
                  Estate City, EC 12345
                  <br />
                  United States
                </p>
              </div>

              {/* Hours */}
              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Support Hours</h3>
                <p className="text-gray-600 text-sm">
                  Monday - Friday
                  <br />
                  9:00 AM - 6:00 PM EST
                  <br />
                  Weekend emergency support
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold mb-6">Send Us a Message</h2>
                <p className="text-gray-600 mb-8">
                  Fill out the form below and we'll get back to you within 24
                  hours. For urgent matters, please call us directly.
                </p>

                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a topic...</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing Question</option>
                      <option value="security">Security Concern</option>
                      <option value="feature">Feature Request</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Please describe how we can help you..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center space-x-2"
                  >
                    <Send className="h-5 w-5" />
                    <span>Send Message</span>
                  </button>
                </form>
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-6">Why Contact Us?</h2>

                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="font-semibold mb-2">Getting Started</h3>
                    <p className="text-gray-600 text-sm">
                      New to WheresTheWill? We'll guide you through the setup
                      process and answer any questions about securing your
                      documents.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="font-semibold mb-2">Technical Support</h3>
                    <p className="text-gray-600 text-sm">
                      Having trouble accessing your account or updating
                      information? Our technical team can help resolve any
                      issues quickly.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="font-semibold mb-2">Account Management</h3>
                    <p className="text-gray-600 text-sm">
                      Need help managing representatives, updating billing
                      information, or making changes to your account settings.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="font-semibold mb-2">Security Questions</h3>
                    <p className="text-gray-600 text-sm">
                      Have concerns about data security or privacy? We're
                      transparent about our security measures and happy to
                      address any concerns.
                    </p>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Emergency Access
                  </h3>
                  <p className="text-blue-800 text-sm">
                    If you're a representative trying to access someone's Will
                    information in an emergency, please call our emergency line
                    at <span className="font-medium">1-800-WILL-911</span> for
                    immediate assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
