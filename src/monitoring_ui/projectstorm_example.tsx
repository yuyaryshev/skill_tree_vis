// GRAPH EDITOR START ////////////////////////
// Статья на Medium https://blog.sourcerer.io/build-interactive-diagrams-with-storm-react-diagrams-f172ae26af9d
//      - Авто layout-см статью!!!!
// DEMOS https://github.com/projectstorm/react-diagrams/tree/master/packages/diagrams-demo-gallery/demos
// https://github.com/projectstorm/react-diagrams
// https://projectstorm.gitbook.io/react-diagrams/customizing/ports
// GRAPH EDITOR END ////////////////////////

import createEngine, { DiagramModel, DefaultNodeModel, DefaultLinkModel } from '@projectstorm/react-diagrams';
import * as React from 'react';
import { CanvasWidget } from '@projectstorm/react-canvas-core';
//.............................................
import styled from '@emotion/styled';

export interface DemoCanvasWidgetProps {
    color?: string;
    background?: string;
}

export const StylesContainer = styled.div<{ color: string; background: string }>`
    height: 100%;
    background-color: ${p => p.background};
    background-size: 50px 50px;
    display: flex;
    > * {
        height: 100%;
        min-height: 100%;
        width: 100%;
    }
    background-image: linear-gradient(
            0deg,
            transparent 24%,
            ${p => p.color} 25%,
            ${p => p.color} 26%,
            transparent 27%,
            transparent 74%,
            ${p => p.color} 75%,
            ${p => p.color} 76%,
            transparent 77%,
            transparent
        ),
        linear-gradient(
            90deg,
            transparent 24%,
            ${p => p.color} 25%,
            ${p => p.color} 26%,
            transparent 27%,
            transparent 74%,
            ${p => p.color} 75%,
            ${p => p.color} 76%,
            transparent 77%,
            transparent
        );
`;

export class DemoCanvasWidget extends React.Component<DemoCanvasWidgetProps> {
    render() {
        return (
            <StylesContainer
                background={this.props.background || 'rgb(60, 60, 60)'}
                color={this.props.color || 'rgba(255,255,255, 0.05)'}>
                {this.props.children}
            </StylesContainer>
        );
    }
}
//....................................................

export const ProjectStormWidget = () => {
    //1) setup the diagram engine
    var engine = createEngine();

    //2) setup the diagram model
    var model = new DiagramModel();

    //3-A) create a default node
    var node1 = new DefaultNodeModel({
        name: 'Node 1',
        color: 'rgb(0,192,255)'
    });
    node1.setPosition(100, 100);
    let port1 = node1.addOutPort('Out');

    //3-B) create another default node
    var node2 = new DefaultNodeModel('Node 2', 'rgb(192,255,0)');
    let port2 = node2.addInPort('In');
    node2.setPosition(400, 100);

    // link the ports
    let link1 = port1.link<DefaultLinkModel>(port2);
    link1.getOptions().testName = 'Test';
    link1.addLabel('Hello World!');

    //4) add the models to the root graph
    model.addAll(node1, node2, link1);

    //5) load model into engine
    engine.setModel(model);

    //6) render the diagram!
    return (
        <DemoCanvasWidget>
            <CanvasWidget engine={engine} />
        </DemoCanvasWidget>
    );
};