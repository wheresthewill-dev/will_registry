import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";

const ContactUs = () => (
  <div className="flex items-center justify-center">
    <div className="w-full max-w-screen-xl mx-auto xl:px-0">
      <div className="grid lg:grid-cols-2 gap-10 md:gap-12">
        <div className="flex flex-col space-y-4 px-12">
          <ContactInfoCard
            icon={<MailIcon />}
            title={"Email"}
            description={"Our friendly team is here to help."}
            linkText={"theinternationalwillregistry@gmail.com"}
            linkHref={"mailto:wheresthewill@gmail.com"}
          />
          <ContactInfoCard
            icon={<MapPinIcon />}
            title={"Location"}
            description={"Visit us at our office."}
            linkText={"123 Hong Kong Street"}
            linkHref={"https://map.google.com"}
          />
          <ContactInfoCard
            icon={<PhoneIcon />}
            title={"Phone"}
            description={"Mon-Fri from 8am to 5pm."}
            linkText={"+1 (555) 000-0000"}
            linkHref={"tel:akashmoradiya3444@gmail.com"}
          />
        </div>
        {/* Form */}
        <Card>
          <CardContent className="p-6 md:p-10">
            <form>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    placeholder="First name"
                    id="firstName"
                    className="mt-1.5 bg-white h-11"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    placeholder="Last name"
                    id="lastName"
                    className="mt-1.5 bg-white h-11"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    placeholder="Email"
                    id="email"
                    className="mt-1.5 bg-white h-11"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Message"
                    className="mt-1.5 bg-white p-4 h-40 lg:h-68 "
                    rows={10}
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Checkbox id="acceptTerms" />
                  <Label htmlFor="acceptTerms">
                    You agree to our{" "}
                    <Link href="#" className="underline">
                      Terms and Conditions.
                    </Link>
                  </Label>
                </div>
              </div>
              <Button className="mt-6 w-full" size="lg">
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default ContactUs;

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
