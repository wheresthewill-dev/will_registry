"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Loader2, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import { AppConfig } from "@/app/utils/repo_services/interfaces/app_config";
import { useState, FormEvent } from "react";
import { sendContactFormEmail } from "@/services/contactFormService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ContactUsWithConfigProps {
  appConfig?: AppConfig;
}

const ContactUsWithConfig = ({ appConfig }: ContactUsWithConfigProps) => {
  const supportEmail = appConfig?.customer_support_email || "theinternationalwillregistry@gmail.com";
  const businessAddress = appConfig?.business_address || "123 Hong Kong Street";
  const businessContact = appConfig?.business_contact || "+1 (555) 000-0000";
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
    acceptTerms: false
  });
  
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!formData.firstName.trim()) {
      setFormStatus('error');
      setErrorMessage("First name is required");
      return;
    }
    
    if (!formData.lastName.trim()) {
      setFormStatus('error');
      setErrorMessage("Last name is required");
      return;
    }
    
    if (!formData.email.trim()) {
      setFormStatus('error');
      setErrorMessage("Email address is required");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormStatus('error');
      setErrorMessage("Please enter a valid email address");
      return;
    }
    
    if (!formData.message.trim()) {
      setFormStatus('error');
      setErrorMessage("Please enter your message");
      return;
    }
    
    // Terms and conditions validation temporarily disabled
    /* 
    if (!formData.acceptTerms) {
      setFormStatus('error');
      setErrorMessage("You must accept the Terms and Conditions");
      return;
    }
    */
    
    try {
      setFormStatus('submitting');
      
      const result = await sendContactFormEmail(
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          message: formData.message
        }, 
        supportEmail
      );
      
      if (result.success) {
        setFormStatus('success');
      } else {
        setFormStatus('error');
        setErrorMessage(result.error || "Failed to send message. Please try again later.");
      }
    } catch (error) {
      console.error("Contact form submission error:", error);
      setFormStatus('error');
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };
  
  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-screen-xl mx-auto xl:px-0">
        <div className="grid lg:grid-cols-2 gap-10 md:gap-12">
          <div className="flex flex-col space-y-4 px-12">
            <ContactInfoCard
              icon={<MailIcon />}
              title={"Email"}
              description={"Our friendly team is here to help."}
              linkText={supportEmail}
              linkHref={`mailto:${supportEmail}`}
            />
            <ContactInfoCard
              icon={<MapPinIcon />}
              title={"Location"}
              description={"Visit us at our office."}
              linkText={businessAddress}
              linkHref={"https://map.google.com"}
            />
            <ContactInfoCard
              icon={<PhoneIcon />}
              title={"Phone"}
              description={"Mon-Fri from 8am to 5pm."}
              linkText={businessContact}
              linkHref={`tel:${businessContact.replace(/\s+/g, '')}`}
            />
          </div>
          {/* Form */}
          <Card>
            <CardContent className="p-6 md:p-10">
              {formStatus === 'success' ? (
                <div className="text-center py-8">
                  <div className="mx-auto bg-green-100 text-green-800 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
                  <p className="text-gray-600 mb-6">
                    Your message has been sent successfully. We'll get back to you shortly.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFormStatus('idle');
                      setFormData({
                        firstName: "",
                        lastName: "",
                        email: "",
                        message: "",
                        acceptTerms: false
                      });
                    }}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  {formStatus === 'error' && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        {errorMessage || "There was a problem sending your message. Please try again."}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                    <span>Fields marked with</span>
                    <span className="text-red-500">*</span>
                    <span>are required</span>
                  </p>
                
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
                    <div className="col-span-2 sm:col-span-1">
                      <Label htmlFor="firstName" className="flex items-center gap-1">
                        First Name
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="First name"
                        id="firstName"
                        name="firstName"
                        className="mt-1.5 bg-white h-11"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        aria-required="true"
                        disabled={formStatus === 'submitting'}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label htmlFor="lastName" className="flex items-center gap-1">
                        Last Name
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Last name"
                        id="lastName"
                        name="lastName"
                        className="mt-1.5 bg-white h-11"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        aria-required="true"
                        disabled={formStatus === 'submitting'}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="email" className="flex items-center gap-1">
                        Email
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="Email"
                        id="email"
                        name="email"
                        className="mt-1.5 bg-white h-11"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        aria-required="true"
                        pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                        disabled={formStatus === 'submitting'}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="message" className="flex items-center gap-1">
                        Message
                        <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Message"
                        className="mt-1.5 bg-white p-4 h-40 lg:h-68"
                        rows={10}
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        aria-required="true"
                        minLength={10}
                        disabled={formStatus === 'submitting'}
                      />
                    </div>
                    {/* Terms and conditions temporarily disabled
                    <div className="col-span-2 flex items-start gap-2">
                      <div className="mt-1">
                        <Checkbox 
                          id="acceptTerms" 
                          checked={formData.acceptTerms}
                          onCheckedChange={(checked) => 
                            setFormData({...formData, acceptTerms: checked === true})
                          }
                          disabled={formStatus === 'submitting'}
                          required
                          aria-required="true"
                        />
                      </div>
                      <div>
                        <Label htmlFor="acceptTerms" className="text-sm text-gray-700 flex items-center gap-1">
                          I agree to the{" "}
                          <Link href="/terms" className="underline text-primary">
                            Terms and Conditions
                          </Link>
                          <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          This field is required
                        </p>
                      </div>
                    </div>
                    */}
                  </div>
                  <Button 
                    type="submit" 
                    className="mt-6 w-full" 
                    size="lg" 
                    disabled={formStatus === 'submitting'}
                  >
                    {formStatus === 'submitting' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactUsWithConfig;

interface ContactInfoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  linkText: string;
  linkHref: string;
}

function ContactInfoCard({
  icon,
  title,
  description,
  linkText,
  linkHref,
}: ContactInfoCardProps) {
  return (
    <div className="w-full bg-accent rounded-2xl flex flex-col items-center justify-center text-center p-6 sm:items-start sm:text-left">
      <div className="h-12 w-12 flex items-center justify-center bg-primary text-white rounded-full">
        {icon}
      </div>
      <h3 className="mt-6 font-semibold text-xl">{title}</h3>
      <p className="my-2.5 text-muted-foreground">{description}</p>
      <Link
        className="font-medium text-primary hover:underline"
        href={linkHref}
      >
        {linkText}
      </Link>
    </div>
  );
}