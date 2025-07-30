import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Shield, Eye, Lock, Database, Users, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900 to-cyan-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-bounce delay-1000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <Link href="/" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-8">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>

            <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Privacy Policy
                </h1>
                <p className="text-gray-400">Your privacy is our priority</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-6 pb-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-gray-300 mb-8">
                  <strong>Effective Date:</strong> January 30, 2025<br />
                  <strong>Last Updated:</strong> January 30, 2025
                </p>

                <div className="space-y-8">
                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                      <Eye className="w-6 h-6 mr-3 text-teal-400" />
                      Overview
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                      TaskScout ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our maintenance management platform, including our website, mobile application, and related services (collectively, the "Service").
                    </p>
                    <p className="text-gray-300 leading-relaxed mt-4">
                      By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. We will not use or share your information except as described in this Privacy Policy.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                      <Database className="w-6 h-6 mr-3 text-teal-400" />
                      Information We Collect
                    </h2>
                    
                    <h3 className="text-xl font-semibold text-white mb-3">Personal Information</h3>
                    <p className="text-gray-300 mb-4">We collect information you provide directly to us, including:</p>
                    <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                      <li>Name, email address, phone number, and business information</li>
                      <li>Account credentials and profile information</li>
                      <li>Payment information (processed securely through third-party providers)</li>
                      <li>Communication preferences and support inquiries</li>
                      <li>Professional qualifications and service provider credentials</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-white mb-3">Usage Information</h3>
                    <p className="text-gray-300 mb-4">We automatically collect certain information about your use of our Service:</p>
                    <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                      <li>Device information (IP address, browser type, operating system)</li>
                      <li>Usage patterns and feature interactions</li>
                      <li>Log files and performance data</li>
                      <li>Location information (with your consent)</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-white mb-3">Content and Communications</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                      <li>Maintenance tickets, work orders, and related documentation</li>
                      <li>Photos, videos, and files uploaded to the platform</li>
                      <li>Messages and communications within the platform</li>
                      <li>Reviews, ratings, and feedback</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                      <Users className="w-6 h-6 mr-3 text-teal-400" />
                      How We Use Your Information
                    </h2>
                    <p className="text-gray-300 mb-4">We use the information we collect to:</p>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                      <li>Provide, maintain, and improve our maintenance management services</li>
                      <li>Process transactions and manage your account</li>
                      <li>Connect you with appropriate service providers or clients</li>
                      <li>Send important notifications about your account and services</li>
                      <li>Provide customer support and respond to inquiries</li>
                      <li>Generate analytics to improve platform performance</li>
                      <li>Ensure platform security and prevent fraud</li>
                      <li>Comply with legal obligations and enforce our terms</li>
                      <li>Send marketing communications (with your consent)</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                      <Mail className="w-6 h-6 mr-3 text-teal-400" />
                      Information Sharing and Disclosure
                    </h2>
                    <p className="text-gray-300 mb-4">We may share your information in the following circumstances:</p>
                    
                    <h3 className="text-xl font-semibold text-white mb-3">Service Providers</h3>
                    <p className="text-gray-300 mb-4">We share information with trusted third-party service providers who assist us in operating our platform, including payment processors, cloud hosting providers, and analytics services.</p>

                    <h3 className="text-xl font-semibold text-white mb-3">Platform Users</h3>
                    <p className="text-gray-300 mb-4">Certain information is shared within the platform to facilitate services:</p>
                    <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                      <li>Contact information shared between clients and service providers</li>
                      <li>Work history and ratings for service quality assurance</li>
                      <li>Location information necessary for service delivery</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-white mb-3">Legal Requirements</h3>
                    <p className="text-gray-300 mb-4">We may disclose information when required by law or to:</p>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                      <li>Comply with legal processes and government requests</li>
                      <li>Protect our rights, property, or safety</li>
                      <li>Prevent fraud or illegal activities</li>
                      <li>Enforce our Terms of Service</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                      <Lock className="w-6 h-6 mr-3 text-teal-400" />
                      Data Security
                    </h2>
                    <p className="text-gray-300 mb-4">We implement comprehensive security measures to protect your information:</p>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                      <li>Industry-standard encryption for data transmission and storage</li>
                      <li>Regular security audits and vulnerability assessments</li>
                      <li>Access controls and employee training on data protection</li>
                      <li>Secure data centers with physical and digital safeguards</li>
                      <li>Incident response procedures for security breaches</li>
                    </ul>
                    <p className="text-gray-300 mt-4">
                      While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Your Rights and Choices</h2>
                    <p className="text-gray-300 mb-4">You have the following rights regarding your personal information:</p>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                      <li><strong>Access:</strong> Request a copy of your personal information</li>
                      <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                      <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                      <li><strong>Portability:</strong> Receive your data in a portable format</li>
                      <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                      <li><strong>Restriction:</strong> Request limitations on how we use your data</li>
                    </ul>
                    <p className="text-gray-300 mt-4">
                      To exercise these rights, contact us at <a href="mailto:privacy@taskscout.ai" className="text-teal-400 hover:text-teal-300">privacy@taskscout.ai</a>.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Data Retention</h2>
                    <p className="text-gray-300">
                      We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. We will delete or anonymize your information when it is no longer needed, unless we are required to retain it for legal, regulatory, or legitimate business purposes.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">International Data Transfers</h2>
                    <p className="text-gray-300">
                      Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable data protection laws.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Changes to This Privacy Policy</h2>
                    <p className="text-gray-300">
                      We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of our Service after such modifications constitutes acceptance of the updated Privacy Policy.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
                    <p className="text-gray-300 mb-4">
                      If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                    </p>
                    <div className="bg-teal-500/10 rounded-lg p-6 border border-teal-500/20">
                      <p className="text-white mb-2"><strong>Email:</strong> privacy@taskscout.ai</p>
                      <p className="text-white mb-2"><strong>Support:</strong> hello@taskscout.ai</p>
                      <p className="text-white"><strong>Address:</strong> TaskScout, Inc., Privacy Department</p>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-12 text-center">
              <Link href="/support">
                <Button className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 hover:from-teal-600 hover:via-cyan-600 hover:to-blue-600 text-lg px-8 py-4">
                  Have Questions? Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}