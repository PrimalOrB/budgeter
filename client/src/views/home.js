import React from "react";
import { ButtonContainer }from '../components/Menus'

const Home = () => {

  // create budget buttons
  const budgetButtons = [
    { title: 'test title', desc: 'test', link: 'http://www.test.com' }, 
    { title: 'test title 2', desc: 'test 2', link: 'http://www.test2.com' }, 
    { title: 'test title 3', desc: 'test 3', link: 'http://www.test2.com' }
  ]

  // add "Create New" to buttons
  budgetButtons.push( { title: 'Create New Budget +', desc: 'test', link: '/add-budget', disabled: true } )
  
  return (
    <>
      <ButtonContainer title={ 'Your Budgets'} buttons={ budgetButtons }/>
      <ButtonContainer title={ 'Your Budgets 2'} buttons={ budgetButtons }/>
    </>
  )

};

export default Home;
