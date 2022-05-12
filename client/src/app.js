import React from "react";
import { Switch } from "react-router-dom";
import { setContext } from '@apollo/client/link/context';
import { useAuth0 } from "@auth0/auth0-react";
import { ApolloProvider, ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { StoreProvider } from "./utils/GlobalState";
import { 
  FullPageSpinLoader, 
  Header, 
  // Footer 
} from "./components";
import { 
  Home, 
  AddBudget, 
  Budget
 } from "./views";
import ProtectedRoute from "./auth/protected-route";

const httpLink = createHttpLink({
  uri: '/graphql',
});

export const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('id_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const App = () => {
  const { isLoading } = useAuth0();

  if (isLoading) {
    return <FullPageSpinLoader />;
  }

  return (
    <ApolloProvider client={client}>
      <StoreProvider>
        <div id="app">
          <Header/>
          <main>
            <Switch>
              <ProtectedRoute exact path="/" component={ Home } />
              <ProtectedRoute exact path="/add-budget" component={ AddBudget } />
              <ProtectedRoute exact path="/budget/:id/:tab?/:cat?" component={ Budget } />
            </Switch>
          </main>
        </div>
      </StoreProvider>
    </ApolloProvider>
  );
};

export default App;
