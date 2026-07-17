import { Types } from '@ohif/core';
import { studyWithImages } from './utils/studySelectors';
import { viewportOptions } from './utils/viewportOptions';

const MODALITY_WEIGHT = 100;

function makeModalityGridProtocol(id: string, name: string, modalityCode: string): Types.HangingProtocol.Protocol {
  return {
    id,
    description: `Modality-matched adaptive grid for ${modalityCode}`,
    name,
    protocolMatchingRules: [
      ...studyWithImages,
      {
        id: `Modality-${modalityCode}`,
        weight: MODALITY_WEIGHT,
        attribute: 'ModalitiesInStudy',
        constraint: {
          contains: modalityCode,
        },
        required: true,
      },
    ],
    toolGroupIds: ['default'],
    displaySetSelectors: {
      defaultDisplaySetId: {
        allowUnmatchedView: true,
        seriesMatchingRules: [
          {
            attribute: 'numImageFrames',
            constraint: { greaterThan: { value: 0 } },
            weight: 1,
            required: true,
          },
        ],
      },
    },
    defaultViewport: {
      viewportOptions: {
        viewportType: 'stack',
        toolGroupId: 'default',
      },
      displaySets: [
        {
          id: 'defaultDisplaySetId',
          matchedDisplaySetsIndex: -1,
        },
      ],
    },
    stages: [
      {
        name: '2x2',
        stageActivation: { enabled: { minViewportsMatched: 4 } },
        viewportStructure: { layoutType: 'grid', properties: { rows: 2, columns: 2 } },
        viewports: [0, 1, 2, 3].map(i => ({
          viewportOptions,
          displaySets: [{ id: 'defaultDisplaySetId', matchedDisplaySetsIndex: i }],
        })),
      },
      {
        name: '3x1',
        stageActivation: { enabled: { minViewportsMatched: 3 } },
        viewportStructure: { layoutType: 'grid', properties: { rows: 1, columns: 3 } },
        viewports: [0, 1, 2].map(i => ({
          viewportOptions,
          displaySets: [{ id: 'defaultDisplaySetId', matchedDisplaySetsIndex: i }],
        })),
      },
      {
        name: '2x1',
        stageActivation: { enabled: { minViewportsMatched: 2 } },
        viewportStructure: { layoutType: 'grid', properties: { rows: 1, columns: 2 } },
        viewports: [0, 1].map(i => ({
          viewportOptions,
          displaySets: [{ id: 'defaultDisplaySetId', matchedDisplaySetsIndex: i }],
        })),
      },
      {
        name: '1x1',
        stageActivation: { enabled: { minViewportsMatched: 1 } },
        viewportStructure: { layoutType: 'grid', properties: { rows: 1, columns: 1 } },
        viewports: [
          {
            viewportOptions,
            displaySets: [{ id: 'defaultDisplaySetId' }],
          },
        ],
      },
    ],
    numberOfPriorsReferenced: -1,
  } as Types.HangingProtocol.Protocol;
}

const MODALITIES: Array<[string, string]> = [
  ['CT', 'CT'],
  ['MR', 'MR'],
  ['US', 'Ultrasound'],
  ['NM', 'Nuclear Medicine'],
  ['PT', 'PET'],
  ['CR', 'Computed Radiography'],
  ['DX', 'Digital X-Ray'],
  ['DR', 'Digital Radiography'],
  ['XA', 'X-Ray Angiography'],
  ['RF', 'Radio Fluoroscopy'],
  ['ES', 'Endoscopy'],
];

export const modalityGridProtocols = MODALITIES.map(([code, label]) =>
  makeModalityGridProtocol(`@icrco/hpModality${code}`, `${label} Grid`, code)
);
