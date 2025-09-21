import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
const LogoutButton = ({navigate}) => {
  const { logout } = useAuth();

  return (
    <Button onClick={() => logout(navigate)}>
      Logout
    </Button>
  );
};

export default LogoutButton;
