import { SignUp } from "@clerk/nextjs";

export default function SignUpComponent() {
  return (
    <div>
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
