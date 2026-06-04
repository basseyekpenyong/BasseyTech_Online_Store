import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});
type FormData = z.infer<typeof schema>;

const contactInfo = [
  {
    icon: MapPin,
    label: "Visit Us",
    lines: ["41 Uncle Joe Avenue", "Kubwa, Abuja", "Nigeria"],
  },
  {
    icon: Phone,
    label: "Call Us",
    lines: ["+234 806 360 7290", "+234 701 234 6604"],
    links: ["tel:+2348063607290", "tel:+2347012346604"],
  },
  {
    icon: Mail,
    label: "Email Us",
    lines: ["globalchibatech@gmail.com"],
    links: ["mailto:globalchibatech@gmail.com"],
  },
  {
    icon: Clock,
    label: "Business Hours",
    lines: ["Mon – Fri: 8 AM – 6 PM", "Sat: 9 AM – 4 PM", "Sun: Closed"],
  },
];

export default function ContactPage() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    // In production: send to a backend endpoint or email service
    console.log("Contact form submission:", data);
    toast.success("Message sent! We'll get back to you within 24 hours.");
    reset();
  };

  return (
    <div className="container py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Have a question, need a quote, or want to book a service? Reach out — we're here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Contact info cards */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contactInfo.map(({ icon: Icon, label, lines, links }) => (
              <Card key={label}>
                <CardContent className="pt-5 space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    {label}
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-0.5">
                    {lines.map((line, i) => (
                      <li key={i}>
                        {links?.[i] ? (
                          <a href={links[i]} className="hover:text-foreground transition-colors">
                            {line}
                          </a>
                        ) : line}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Google Maps embed placeholder */}
          <div className="rounded-lg border overflow-hidden h-48 bg-muted flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center space-y-1">
              <MapPin className="mx-auto h-6 w-6" />
              <p>41 Uncle Joe Avenue, Kubwa, Abuja, Nigeria</p>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold text-lg mb-4">Send a Message</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input placeholder="Your name" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Email Address</Label>
                <Input type="email" placeholder="you@example.com" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Phone (optional)</Label>
                <Input type="tel" placeholder="+234 000 000 0000" {...register("phone")} />
              </div>
              <div className="space-y-1">
                <Label>Message</Label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  placeholder="Tell us how we can help…"
                  {...register("message")}
                />
                {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
