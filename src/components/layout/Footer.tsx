const Footer = () => {
  return (
    <footer className="border-t py-8 bg-muted/50 mt-auto">
      <div className="container text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Lodger. All rights reserved.</p>
        <p className="mt-1">Your Home Away From Home.</p>
      </div>
    </footer>
  );
};

export default Footer;
