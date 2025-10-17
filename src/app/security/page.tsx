import PublicLayout from "@/components/public-layout";
import {
  Shield,
  Lock,
  Eye,
  Server,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Security Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              How We Protect Your Data
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our comprehensive security framework ensures your information
              remains private, secure, and accessible only to authorised
              individuals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Encryption */}
            <div className="bg-white p-6 rounded-lg shadow-lg border">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                End-to-End Encryption
              </h3>
              <p className="text-gray-600">
                All your data is encrypted using AES-256 encryption, the same
                standard used by banks and government agencies.
              </p>
            </div>

            {/* Privacy */}
            <div className="bg-white p-6 rounded-lg shadow-lg border">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Zero-Knowledge Architecture
              </h3>
              <p className="text-gray-600">
                We cannot see your private information. Only you and your
                authorised representatives have access to your data.
              </p>
            </div>

            {/* Infrastructure */}
            <div className="bg-white p-6 rounded-lg shadow-lg border">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Server className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Secure Infrastructure
              </h3>
              <p className="text-gray-600">
                Our servers are hosted on enterprise-grade cloud infrastructure
                with 24/7 monitoring and automatic security updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Industry Compliance</h2>
              <p className="text-gray-600 mb-6">
                We adhere to the highest industry standards and regulations to
                ensure your data is protected according to legal requirements.
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">SOC 2 Type II Certified</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">GDPR Compliant</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">CCPA Compliant</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">HIPAA Level Security</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4">
                Security Audit Results
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Data Encryption</span>
                  <span className="text-green-600 font-semibold">
                    ✓ Excellent
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Access Controls</span>
                  <span className="text-green-600 font-semibold">
                    ✓ Excellent
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Infrastructure Security</span>
                  <span className="text-green-600 font-semibold">
                    ✓ Excellent
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Vulnerability Management
                  </span>
                  <span className="text-green-600 font-semibold">
                    ✓ Excellent
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Last audited: March 2024 by CyberSec Professionals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Best Practices Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Security Best Practices</h2>
            <p className="text-gray-600">
              Here are some recommendations to help you maintain the highest
              level of security.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Important Security Tips
                </h3>
                <ul className="text-yellow-700 space-y-2">
                  <li>• Use a strong, unique password for your account</li>
                  <li>• Enable two-factor authentication when available</li>
                  <li>• Keep your contact information up to date</li>
                  <li>• Regularly review your authorised representatives</li>
                  <li>• Log out from shared or public devices</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold mb-3">What We Monitor</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Suspicious login attempts</li>
                <li>• Unusual access patterns</li>
                <li>• System vulnerabilities</li>
                <li>• Data integrity checks</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold mb-3">Incident Response</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• 24/7 security monitoring</li>
                <li>• Immediate threat containment</li>
                <li>• Transparent communication</li>
                <li>• Regular security updates</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
