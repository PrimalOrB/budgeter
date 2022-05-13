import React from "react";
import { ActionButton } from '../Buttons'
import { Title } from '../Layout'

const NavStateContainer = ( { buttons, title, state, setState, addClass } ) => {

    addClass = addClass || ''

    function select( x ){
        setState( x.link )
    }

    return (
        <>
        <section className={ addClass }>
            { title && <Title text={ title } /> }
            <div className="nav-menu full-width border-bot-hightlight grad-bg">
                { buttons.map( ( x, i ) => {
                    return <ActionButton key={ `${i}_budget` } text={ x.text } additionalClass={ state === x.link ? 'nav-button-active' : '' } action={ () => select( x ) }/>
                })}
            </div>
        </section>
        </>
    )
};

export default NavStateContainer;
