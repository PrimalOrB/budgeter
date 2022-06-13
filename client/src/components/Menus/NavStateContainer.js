import React from "react";
import { ActionButton, ActionButtonSVG } from '../Buttons'
import { Title } from '../Layout'

const NavStateContainer = ( { buttons, title, state, setState, addClass, id } ) => {

    addClass = addClass || ''
    id = id || ''

    function select( x ){
        setState( x.link )
    }

    return (
        <>
        <section id={ id } className={ addClass }>
            { title && <Title text={ title } /> }
            <div className="nav-menu full-width border-bot-hightlight grad-bg">
                { buttons.map( ( button, i ) => {
                    if( button.svg ){
                        return <ActionButtonSVG key={ `${i}_budget` } text={ button.text } additionalClass={ state === button.link ? 'nav-button-active' : '' } svg={ button.svg } svgClass={ button.svgClass } action={ () => select( button ) }/>   
                    }
                    return <ActionButton key={ `${i}_budget` } text={ button.text } additionalClass={ state === button.link ? 'nav-button-active' : '' } action={ () => select( button ) }/>
                })}
            </div>
        </section>
        </>
    )
};

export default NavStateContainer;
