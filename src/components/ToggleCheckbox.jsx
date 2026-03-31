import styled from 'styled-components';

export default function ToggleCheckbox({ checked, onChange, label }) {
  return (
    <Wrapper>
      <Label>
        <HiddenInput type="checkbox" checked={checked} onChange={onChange} />
        <Box>
          <Transition $checked={checked} />
        </Box>
        {label && <LabelText>{label}</LabelText>}
      </Label>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: inline-flex;
  align-items: center;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
`;

const HiddenInput = styled.input`
  position: absolute;
  visibility: hidden;
  width: 0;
  height: 0;
`;

const Box = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 0 2px #2387B6;
  flex-shrink: 0;
`;

const Transition = styled.div`
  width: 60px;
  height: 60px;
  background-color: #2387B6;
  position: absolute;
  transform: rotateZ(45deg);
  transition: 300ms ease;
  top: ${(p) => (p.$checked ? '-10px' : '-52px')};
  left: ${(p) => (p.$checked ? '-10px' : '-52px')};
`;

const LabelText = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
`;
