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
        <nav id={ id } className={ `tabs-container ${ addClass }` }>
            { title && <Title text={ title } /> }
            <div className="tabs" role="tablist">
                { buttons.map( ( button, i ) => {
                    if( button.svg ){
                        return <ActionButtonSVG key={ `${i}_budget` } text={ button.text } additionalClass={ state === button.link ? 'tab-active' : '' } svg={ button.svg } svgClass={ button.svgClass } action={ () => select( button ) }/>
                    }
                    return <ActionButton key={ `${i}_budget` } text={ button.text } additionalClass={ state === button.link ? 'tab-active' : '' } action={ () => select( button ) }/>
                })}
            </div>
        </nav>
    )
};

export default NavStateContainer;
