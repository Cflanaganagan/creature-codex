import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CreaturesProvider } from "@/hooks/useCreatures";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Browse from "@/pages/browse";
import Mystery from "@/pages/mystery";
import CreatureDetail from "@/pages/creature";
import Import from "@/pages/import";
import Timeline from "@/pages/timeline";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/browse" component={Browse} />
      <Route path="/mystery" component={Mystery} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/import" component={Import} />
      <Route path="/creature/:id" component={CreatureDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CreaturesProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </CreaturesProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
