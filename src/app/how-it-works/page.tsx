import { CheckCircle, FileText, Users, Shield, Clock } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="">
      {/* Steps Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                1. Register Your Will
              </h3>
              <p className="text-gray-600">
                Add the location and details of your Will and other important
                documents. We keep this information secure and encrypted.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                2. Authorize Representatives
              </h3>
              <p className="text-gray-600">
                Designate trusted family members or legal representatives who
                can access this information when needed.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Stay Protected</h3>
              <p className="text-gray-600">
                Your information remains private and secure. Only you and your
                authorised representatives can access it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Service?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide peace of mind through secure, accessible, and reliable
              document management for your most important legal papers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Bank-Level Security</h3>
                  <p className="text-gray-600">
                    Your sensitive information is protected with
                    enterprise-grade encryption and security protocols.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-start space-x-4">
                <Clock className="h-6 w-6 text-blue-500 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">
                    Quick Access When Needed
                  </h3>
                  <p className="text-gray-600">
                    Authorised representatives can quickly locate your documents
                    during critical times, avoiding delays.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-start space-x-4">
                <Users className="h-6 w-6 text-purple-500 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Family Coordination</h3>
                  <p className="text-gray-600">
                    Keep your family informed and organized with clear access to
                    important document locations.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-start space-x-4">
                <Shield className="h-6 w-6 text-red-500 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Legal Compliance</h3>
                  <p className="text-gray-600">
                    Our system helps ensure your estate planning meets legal
                    requirements and reduces probate complications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
