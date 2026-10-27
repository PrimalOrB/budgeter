import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { useAuth0 } from "@auth0/auth0-react";
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client";
import { StoreProvider } from "./utils/GlobalState";
import {
  FullPageSpinLoader,
  Header,
  EditModal,
  // Footer
} from "./components";
import { Home, CallbackPage, AddBudget, Budget } from "./views";

const httpLink = createHttpLink({
  uri: "/graphql",
});

export const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("id_token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// the server token expires; drop it and reload so Header signs in again
const RELOAD_GUARD_KEY = "auth_reload_at";
const errorLink = onError(({ graphQLErrors }) => {
  const unauthenticated = graphQLErrors?.some(
    (err) => err.extensions?.code === "UNAUTHENTICATED"
  );
  if (!unauthenticated) {
    return;
  }
  const lastReload = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
  if (Date.now() - lastReload > 60 * 1000) {
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
    localStorage.removeItem("id_token");
    window.location.reload();
  }
});

const client = new ApolloClient({
  link: errorLink.concat(authLink).concat(httpLink),
  cache: new InMemoryCache(),
});

const App = () => {
  const { isLoading } = useAuth0();

  const [editingModal, setEditingModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [pageState, setPageState] = useState("dashboard");
  // bumped when the modal changes data, so the budget view refetches
  const [dataVersion, setDataVersion] = useState(0);

  if (isLoading) {
    return <FullPageSpinLoader />;
  }
  return (
    <ApolloProvider client={client}>
      <StoreProvider>
        <div id="app">
          <Header />
          <EditModal
            pageState={pageState}
            setPageState={setPageState}
            editingModal={editingModal}
            setEditingModal={setEditingModal}
            editingTransaction={editingTransaction}
            setEditingTransaction={setEditingTransaction}
            onDataChanged={() => setDataVersion((version) => version + 1)}
          />
          <main className="app-main">
            <Routes>
              <Route element={<Home />} path="/" />
              <Route element={<CallbackPage />} path="/callback" />
              <Route element={<AddBudget />} path="/add-budget" />
              <Route
                element={
                  <Budget
                    pageState={pageState}
                    setPageState={setPageState}
                    editingModal={editingModal}
                    setEditingModal={setEditingModal}
                    editingTransaction={editingTransaction}
                    setEditingTransaction={setEditingTransaction}
                    dataVersion={dataVersion}
                  />
                }
                path="/budget/:id/:tab?/:cat?"
              />
            </Routes>
          </main>
        </div>
      </StoreProvider>
    </ApolloProvider>
  );
};

export default App;
