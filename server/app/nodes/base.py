<![CDATA["""Base node class for the OpenFlow node system.

Every node in OpenFlow — whether it generates images, processes text,
or calls an external API — inherits from `BaseNode`. This provides a
consistent interface for the workflow engine to discover, validate,
and execute nodes.

Example of creating a custom node:

    class UpscaleImage(BaseNode):
        name = "Upscale Image"
        category = "image"
        description = "Upscale an image using Real-ESRGAN."

        inputs = {
            "image": NodeInput(type="image", description="Source image to upscale"),
            "scale": NodeInput(type="int", description="Scale factor", default=2),
        }
        outputs = {
            "image": NodeOutput(type="image", description="Upscaled image"),
        }

        def execute(self, image: bytes, scale: int = 2, **kwargs) -> dict:
            upscaled = real_esrgan_upscale(image, scale)
            return {"image": upscaled}
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class NodeInput:
    """Schema for a single node input port.

    Attributes:
        type: Data type accepted by this input (e.g., "string", "image", "int", "float").
        description: Human-readable explanation shown in the UI tooltip.
        default: Optional default value when the input is not connected.
        required: Whether the input must be connected or filled before execution.
        options: For enum-style inputs, a list of allowed values.
    """

    type: str
    description: str = ""
    default: Any = None
    required: bool = True
    options: list[str] | None = None


@dataclass
class NodeOutput:
    """Schema for a single node output port.

    Attributes:
        type: Data type produced by this output.
        description: Human-readable explanation of the output.
    """

    type: str
    description: str = ""


class BaseNode:
    """Abstract base class for all OpenFlow nodes.

    Subclasses must define:
        - `name`: Display name in the node palette.
        - `category`: Grouping category (image, video, text, audio, transform, io).
        - `description`: What this node does, shown in the UI.
        - `inputs`: Dict of input port name → NodeInput.
        - `outputs`: Dict of output port name → NodeOutput.
        - `execute(**kwargs) -> dict`: The actual computation.

    The workflow engine calls `validate()` before `execute()` to ensure
    all required inputs are present and type-compatible.
    """

    name: str = "Unnamed Node"
    category: str = "general"
    description: str = ""
    inputs: dict[str, NodeInput] = {}
    outputs: dict[str, NodeOutput] = {}

    def validate(self, input_values: dict[str, Any]) -> list[str]:
        """Check that all required inputs are present and have valid types.

        Args:
            input_values: Mapping of input port name to the value provided
                by the upstream node or user configuration.

        Returns:
            A list of validation error messages. Empty list means valid.
        """
        errors: list[str] = []
        for port_name, port_schema in self.inputs.items():
            if port_schema.required and port_name not in input_values:
                errors.append(f"Missing required input: '{port_name}'")
        return errors

    def execute(self, **kwargs: Any) -> dict[str, Any]:
        """Run the node's computation.

        Override this method in every subclass. The keyword arguments
        correspond to the input port names. Return a dict mapping
        output port names to their produced values.

        Args:
            **kwargs: Input values keyed by port name.

        Returns:
            Dict of output port name → computed value.

        Raises:
            NotImplementedError: If the subclass hasn't overridden this method.
        """
        raise NotImplementedError(
            f"Node '{self.name}' must implement the execute() method."
        )

    def to_dict(self) -> dict[str, Any]:
        """Serialize the node schema for the frontend node palette.

        Returns:
            Dictionary containing name, category, description,
            and input/output schemas.
        """
        return {
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "inputs": {
                k: {"type": v.type, "description": v.description, "default": v.default, "required": v.required}
                for k, v in self.inputs.items()
            },
            "outputs": {
                k: {"type": v.type, "description": v.description}
                for k, v in self.outputs.items()
            },
        }
]]>