import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft, FileText, Scale, Shield, AlertTriangle, CreditCard, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfServicePage() {
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
                <Scale className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Terms of Service
                </h1>
                <p className="text-gray-400">Legal terms and conditions</p>
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
                      <FileText className="w-6 h-6 mr-3 text-teal-400" />
                      Agreement Overview
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                      These Terms of Service ("Terms") govern your access to and use of TaskScout's maintenance management platform, including our website, mobile application, and related services (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
                    </p>
                    <p className="text-gray-300 leading-relaxed mt-4">
                      If you do not agree to these Terms, you may not access or use our Service. These Terms apply to all users of the Service, including businesses, service providers, and individual users.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                      <Users className="w-6 h-6 mr-3 text-teal-400" />
                      User Accounts and Responsibilities
                    </h2>
                    
                    <h3 className="text-xl font-semibold text-white mb-3">Account Creation</h3>
                    <p className="text-gray-300 mb-4">To use our Service, you must:</p>
                    <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                      <li>Provide accurate, current, and complete information during registration</li>
                      <li>Maintain and update your account information as needed</li>
                      <li>Be at least 18 years old or have parental consent</li>
                      <li>Comply with all applicable laws and regulations</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-white mb-3">Account Security</h3>
                    <p className="text-gray-300 mb-4">You are responsible for:</p>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                      <li>Maintaining the confidentiality of your account credentials</li>
                      <li>All activities that occur under your account</li>
                      <li>Notifying us immediately of any unauthorized use</li>
                      <li>Ensuring your account information remains accurate</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Service Description</h2>
                    
                    <h3 className="text-xl font-semibold text-white mb-3">Platform Services</h3>
                    <p className="text-gray-300 mb-4">TaskScout provides a comprehensive maintenance management platform that includes:</p>
                    <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                      <li>AI-powered ticket creation and management system</li>
                      <li>Marketplace for connecting businesses with service providers</li>
                      <li>Work order management and documentation tools</li>
                      <li>Payment processing and invoicing capabilities</li>
                      <li>Mobile applications for iOS and Android</li>
                      <li>Calendar integration and scheduling tools</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-white mb-3">Service Availability</h3>
                    <p className="text-gray-300">
                      We strive to maintain high service availability but do not guarantee uninterrupted access. We may modify, suspend, or discontinue any part of our Service with reasonable notice.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">User Conduct and Prohibited Uses</h2>
                    <p className="text-gray-300 mb-4">You agree not to:</p>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                      <li>Use the Service for any illegal or unauthorized purpose</li>
                      <li>Violate any applicable laws, regulations, or third-party rights</li>
                      <li>Upload malicious code, viruses, or harmful content</li>
                      <li>Attempt to gain unauthorized access to our systems</li>
                      <li>Interfere with the proper functioning of the Service</li>
                      <li>Impersonate any person or entity</li>
                      <li>Collect user information without consent</li>
                      <li>Engage in fraudulent or deceptive practices</li>
                      <li>Post offensive, discriminatory, or inappropriate content</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                      <CreditCard className="w-6 h-6 mr-3 text-teal-400" />
                      Payment Terms
                    </h2>
                    
                    <h3 className="text-xl font-semibold text-white mb-3">Subscription Fees</h3>
                    <p className="text-gray-300 mb-4">
                      TaskScout operates on a freemium model:
                    </p>
                    <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                      <li><strong>Businesses:</strong> Free access to platform features</li>
                      <li><strong>Service Providers:</strong> $99/month subscription fee</li>
                      <li><strong>Premium Features:</strong> Additional fees may apply for advanced functionality</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-white mb-3">Payment Terms</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                      <li>Subscription fees are billed monthly in advance</li>
                      <li>All fees are non-refundable unless otherwise stated</li>
                      <li>Prices may change with 30 days' notice</li>
                      <li>Failed payments may result in service suspension</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-white mb-3">Transaction Processing</h3>
                    <p className="text-gray-300">
                      TaskScout may facilitate payments between users but is not a party to these transactions. Transaction fees may apply for payment processing services.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property Rights</h2>
                    
                    <h3 className="text-xl font-semibold text-white mb-3">Our Rights</h3>
                    <p className="text-gray-300 mb-4">
                      TaskScout and its licensors own all rights, title, and interest in the Service, including all intellectual property rights. You may not copy, modify, distribute, or create derivative works of our Service without permission.
                    </p>

                    <h3 className="text-xl font-semibold text-white mb-3">Your Content</h3>
                    <p className="text-gray-300 mb-4">
                      You retain ownership of content you submit to the Service. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection with the Service.
                    </p>

                    <h3 className="text-xl font-semibold text-white mb-3">User License</h3>
                    <p className="text-gray-300">
                      We grant you a limited, non-exclusive, non-transferable license to access and use the Service for your business purposes, subject to these Terms.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Data and Privacy</h2>
                    <p className="text-gray-300 mb-4">
                      Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
                    </p>
                    <p className="text-gray-300">
                      You are responsible for ensuring you have appropriate rights to any data you upload to the Service and that such data complies with applicable privacy laws.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                      <AlertTriangle className="w-6 h-6 mr-3 text-teal-400" />
                      Disclaimers and Limitations
                    </h2>
                    
                    <h3 className="text-xl font-semibold text-white mb-3">Service Disclaimers</h3>
                    <p className="text-gray-300 mb-4">
                      THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                    </p>

                    <h3 className="text-xl font-semibold text-white mb-3">Limitation of Liability</h3>
                    <p className="text-gray-300 mb-4">
                      TO THE MAXIMUM EXTENT PERMITTED BY LAW, TASKSCOUT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS OR DATA.
                    </p>

                    <h3 className="text-xl font-semibold text-white mb-3">Third-Party Services</h3>
                    <p className="text-gray-300">
                      We are not responsible for the actions, content, or services of third-party providers connected through our platform. Users engage with service providers at their own risk.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Indemnification</h2>
                    <p className="text-gray-300">
                      You agree to indemnify, defend, and hold harmless TaskScout and its officers, directors, employees, and agents from any claims, damages, losses, and expenses arising from your use of the Service or violation of these Terms.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Termination</h2>
                    
                    <h3 className="text-xl font-semibold text-white mb-3">By You</h3>
                    <p className="text-gray-300 mb-4">
                      You may terminate your account at any time by contacting us or using account deletion features in the Service.
                    </p>

                    <h3 className="text-xl font-semibold text-white mb-3">By Us</h3>
                    <p className="text-gray-300 mb-4">
                      We may suspend or terminate your account if you violate these Terms or engage in harmful conduct. We will provide reasonable notice when possible.
                    </p>

                    <h3 className="text-xl font-semibold text-white mb-3">Effect of Termination</h3>
                    <p className="text-gray-300">
                      Upon termination, your right to use the Service ceases immediately. We may retain certain information as required by law or for legitimate business purposes.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Dispute Resolution</h2>
                    
                    <h3 className="text-xl font-semibold text-white mb-3">Governing Law</h3>
                    <p className="text-gray-300 mb-4">
                      These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles.
                    </p>

                    <h3 className="text-xl font-semibold text-white mb-3">Arbitration</h3>
                    <p className="text-gray-300 mb-4">
                      Most disputes can be resolved through our customer support. For disputes that cannot be resolved informally, you agree to binding arbitration rather than court proceedings, except for small claims court matters.
                    </p>

                    <h3 className="text-xl font-semibold text-white mb-3">Class Action Waiver</h3>
                    <p className="text-gray-300">
                      You agree to resolve disputes individually and waive your right to participate in class actions or representative proceedings.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">General Provisions</h2>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                      <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and TaskScout</li>
                      <li><strong>Modifications:</strong> We may update these Terms with reasonable notice</li>
                      <li><strong>Severability:</strong> If any provision is unenforceable, the remainder remains in effect</li>
                      <li><strong>Assignment:</strong> We may assign these Terms; you may not without our consent</li>
                      <li><strong>Force Majeure:</strong> We are not liable for delays due to circumstances beyond our control</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
                    <p className="text-gray-300 mb-4">
                      For questions about these Terms of Service, please contact us:
                    </p>
                    <div className="bg-teal-500/10 rounded-lg p-6 border border-teal-500/20">
                      <p className="text-white mb-2"><strong>Email:</strong> legal@taskscout.ai</p>
                      <p className="text-white mb-2"><strong>Support:</strong> hello@taskscout.ai</p>
                      <p className="text-white"><strong>Address:</strong> TaskScout, Inc., Legal Department</p>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-12 text-center">
              <Link href="/contact">
                <Button className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 hover:from-teal-600 hover:via-cyan-600 hover:to-blue-600 text-lg px-8 py-4">
                  Questions? Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}