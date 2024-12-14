import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { setContext } from "@apollo/client/link/context";
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

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const App = () => {
  const { isLoading } = useAuth0();

  const [editingModal, setEditingModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [pageState, setPageState] = useState("dashboard");

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
          />
          <main>
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
